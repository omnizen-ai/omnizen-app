-- ============================
-- Fix Function Search Path Security Warnings
-- ============================
-- This migration adds explicit search_path to all functions to prevent
-- potential security issues from schema hijacking attacks

-- Drop and recreate functions with proper search_path setting
-- The search_path is set to an empty string '' which means only system schemas

-- ============================
-- 1. VALIDATION FUNCTIONS
-- ============================

CREATE OR REPLACE FUNCTION is_valid_uuid(input_text TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN FALSE;
  END IF;
  
  BEGIN
    PERFORM input_text::UUID;
    RETURN TRUE;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT
SET search_path = '';

CREATE OR REPLACE FUNCTION is_valid_role(role_name TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN role_name IN ('owner', 'admin', 'manager', 'accountant', 'employee', 'viewer', 'ai_agent');
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT
SET search_path = '';

-- ============================
-- 2. AUTH CONTEXT FUNCTIONS
-- ============================

CREATE OR REPLACE FUNCTION set_auth_context(
  p_user_id UUID,
  p_org_id UUID,
  p_workspace_id UUID DEFAULT NULL,
  p_role TEXT DEFAULT 'employee'
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_success BOOLEAN := TRUE;
BEGIN
  -- Validate required parameters
  IF p_user_id IS NULL THEN
    v_errors := array_append(v_errors, 'user_id cannot be NULL');
    v_success := FALSE;
  END IF;
  
  IF p_org_id IS NULL THEN
    v_errors := array_append(v_errors, 'org_id cannot be NULL');
    v_success := FALSE;
  END IF;
  
  -- Validate role
  IF NOT public.is_valid_role(p_role) THEN
    v_errors := array_append(v_errors, format('Invalid role: %s', p_role));
    v_success := FALSE;
  END IF;
  
  -- If validation failed, return error
  IF NOT v_success THEN
    RETURN jsonb_build_object(
      'success', false,
      'errors', v_errors,
      'timestamp', now()
    );
  END IF;
  
  -- Set session variables with error handling
  BEGIN
    PERFORM set_config('auth.user_id', p_user_id::text, true);
    PERFORM set_config('auth.org_id', p_org_id::text, true);
    PERFORM set_config('auth.workspace_id', COALESCE(p_workspace_id::text, ''), true);
    PERFORM set_config('auth.role', p_role, true);
    
    -- Build success response
    v_result := jsonb_build_object(
      'success', true,
      'user_id', p_user_id,
      'org_id', p_org_id,
      'workspace_id', p_workspace_id,
      'role', p_role,
      'context_set_at', now()
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Return error if setting context failed
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', now()
      );
  END;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

CREATE OR REPLACE FUNCTION verify_auth_context() 
RETURNS JSONB AS $$
DECLARE
  v_user_id TEXT;
  v_org_id TEXT;
  v_workspace_id TEXT;
  v_role TEXT;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
  v_valid BOOLEAN := TRUE;
BEGIN
  -- Get current context values
  v_user_id := current_setting('auth.user_id', true);
  v_org_id := current_setting('auth.org_id', true);
  v_workspace_id := current_setting('auth.workspace_id', true);
  v_role := current_setting('auth.role', true);
  
  -- Check if context is set
  IF v_user_id IS NULL OR v_user_id = '' THEN
    v_warnings := array_append(v_warnings, 'user_id not set');
    v_valid := FALSE;
  ELSIF NOT public.is_valid_uuid(v_user_id) THEN
    v_warnings := array_append(v_warnings, 'user_id is not a valid UUID');
    v_valid := FALSE;
  END IF;
  
  IF v_org_id IS NULL OR v_org_id = '' THEN
    v_warnings := array_append(v_warnings, 'org_id not set');
    v_valid := FALSE;
  ELSIF NOT public.is_valid_uuid(v_org_id) THEN
    v_warnings := array_append(v_warnings, 'org_id is not a valid UUID');
    v_valid := FALSE;
  END IF;
  
  IF v_workspace_id IS NOT NULL AND v_workspace_id != '' AND NOT public.is_valid_uuid(v_workspace_id) THEN
    v_warnings := array_append(v_warnings, 'workspace_id is not a valid UUID');
    v_valid := FALSE;
  END IF;
  
  IF v_role IS NULL OR v_role = '' THEN
    v_warnings := array_append(v_warnings, 'role not set');
    v_valid := FALSE;
  ELSIF NOT public.is_valid_role(v_role) THEN
    v_warnings := array_append(v_warnings, format('Invalid role: %s', v_role));
    v_valid := FALSE;
  END IF;
  
  -- Return verification result
  RETURN jsonb_build_object(
    'valid', v_valid,
    'user_id', v_user_id,
    'org_id', v_org_id,
    'workspace_id', NULLIF(v_workspace_id, ''),
    'role', v_role,
    'warnings', CASE WHEN array_length(v_warnings, 1) > 0 THEN v_warnings ELSE NULL END,
    'verified_at', now()
  );
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION clear_auth_context() 
RETURNS JSONB AS $$
BEGIN
  -- Clear all auth context variables
  PERFORM set_config('auth.user_id', '', true);
  PERFORM set_config('auth.org_id', '', true);
  PERFORM set_config('auth.workspace_id', '', true);
  PERFORM set_config('auth.role', '', true);
  
  RETURN jsonb_build_object(
    'success', true,
    'cleared_at', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- ============================
-- 3. RLS HELPER FUNCTIONS
-- ============================

CREATE OR REPLACE FUNCTION auth_org_id() 
RETURNS UUID AS $$
DECLARE
  v_org_id TEXT;
BEGIN
  v_org_id := current_setting('auth.org_id', true);
  
  IF v_org_id IS NULL OR v_org_id = '' THEN
    -- Try to get from auth.uid() if available (Supabase auth)
    BEGIN
      RETURN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
          AND is_active = true
        LIMIT 1
      );
    EXCEPTION
      WHEN OTHERS THEN
        RETURN NULL;
    END;
  END IF;
  
  BEGIN
    RETURN v_org_id::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION auth_user_id() 
RETURNS UUID AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  v_user_id := current_setting('auth.user_id', true);
  
  IF v_user_id IS NULL OR v_user_id = '' THEN
    -- Try to get from auth.uid() if available (Supabase auth)
    BEGIN
      RETURN auth.uid();
    EXCEPTION
      WHEN OTHERS THEN
        RETURN NULL;
    END;
  END IF;
  
  BEGIN
    RETURN v_user_id::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION auth_workspace_id() 
RETURNS UUID AS $$
DECLARE
  v_workspace_id TEXT;
BEGIN
  v_workspace_id := current_setting('auth.workspace_id', true);
  
  IF v_workspace_id IS NULL OR v_workspace_id = '' THEN
    RETURN NULL;
  END IF;
  
  BEGIN
    RETURN v_workspace_id::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION auth_role() 
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := current_setting('auth.role', true);
  
  IF v_role IS NULL OR v_role = '' THEN
    -- Try to get from organization_members if user_id and org_id are set
    DECLARE
      v_user_id UUID;
      v_org_id UUID;
    BEGIN
      v_user_id := public.auth_user_id();
      v_org_id := public.auth_org_id();
      
      IF v_user_id IS NOT NULL AND v_org_id IS NOT NULL THEN
        SELECT role INTO v_role
        FROM public.organization_members
        WHERE user_id = v_user_id 
          AND organization_id = v_org_id
          AND is_active = true
        LIMIT 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'viewer';  -- Default to least privileged role
    END;
  END IF;
  
  -- Validate and return role
  IF public.is_valid_role(v_role) THEN
    RETURN v_role;
  ELSE
    RETURN 'viewer';  -- Default to least privileged role
  END IF;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- ============================
-- 4. BYPASS RLS FUNCTION
-- ============================

CREATE OR REPLACE FUNCTION bypass_rls() 
RETURNS void AS $$
BEGIN
  -- This function does nothing but exists to document
  -- that service role bypasses RLS by default in Supabase
  NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = '';

COMMENT ON FUNCTION bypass_rls() IS 'Service role bypasses RLS. This function documents that behavior.';

-- ============================
-- GRANT PERMISSIONS
-- ============================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION auth_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_workspace_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION set_auth_context(UUID, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION clear_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_uuid(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bypass_rls() TO authenticated;

-- Also grant to anon for public access if needed
GRANT EXECUTE ON FUNCTION is_valid_uuid(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION is_valid_role(TEXT) TO anon;