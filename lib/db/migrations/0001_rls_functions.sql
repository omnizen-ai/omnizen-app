-- Create RLS helper functions for dual auth system with error handling
-- These functions allow NextAuth sessions to set context for Supabase RLS

-- Validate UUID format
CREATE OR REPLACE FUNCTION is_valid_uuid(input_text TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN FALSE;
  END IF;
  PERFORM input_text::UUID;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validate role values
CREATE OR REPLACE FUNCTION is_valid_role(role_name TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN role_name IN ('owner', 'admin', 'manager', 'accountant', 'employee', 'viewer', 'ai_agent');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Set auth context with error handling
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
  IF NOT is_valid_role(p_role) THEN
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
    PERFORM set_config('auth.context_set_at', now()::text, true);
    
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
      v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', now()
      );
  END;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get organization ID with validation
CREATE OR REPLACE FUNCTION auth_org_id() RETURNS UUID AS $$
DECLARE
  v_org_id TEXT;
BEGIN
  v_org_id := current_setting('auth.org_id', true);
  
  IF v_org_id IS NULL OR v_org_id = '' THEN
    RETURN NULL;
  END IF;
  
  IF is_valid_uuid(v_org_id) THEN
    RETURN v_org_id::UUID;
  ELSE
    RAISE WARNING 'Invalid organization ID in session: %', v_org_id;
    RETURN NULL;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RETURN NULL;
  WHEN OTHERS THEN
    RAISE WARNING 'Error getting organization ID: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get user ID with validation
CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  v_user_id := current_setting('auth.user_id', true);
  
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RETURN NULL;
  END IF;
  
  IF is_valid_uuid(v_user_id) THEN
    RETURN v_user_id::UUID;
  ELSE
    RAISE WARNING 'Invalid user ID in session: %', v_user_id;
    RETURN NULL;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RETURN NULL;
  WHEN OTHERS THEN
    RAISE WARNING 'Error getting user ID: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get workspace ID with validation
CREATE OR REPLACE FUNCTION auth_workspace_id() RETURNS UUID AS $$
DECLARE
  v_workspace_id TEXT;
BEGIN
  v_workspace_id := current_setting('auth.workspace_id', true);
  
  IF v_workspace_id IS NULL OR v_workspace_id = '' THEN
    RETURN NULL;
  END IF;
  
  IF is_valid_uuid(v_workspace_id) THEN
    RETURN v_workspace_id::UUID;
  ELSE
    RAISE WARNING 'Invalid workspace ID in session: %', v_workspace_id;
    RETURN NULL;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RETURN NULL;
  WHEN OTHERS THEN
    RAISE WARNING 'Error getting workspace ID: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get user role with validation and default
CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := current_setting('auth.role', true);
  
  IF v_role IS NULL OR v_role = '' THEN
    RETURN 'viewer'; -- Default to least privileged role
  END IF;
  
  IF NOT is_valid_role(v_role) THEN
    RAISE WARNING 'Invalid role in session: %, defaulting to viewer', v_role;
    RETURN 'viewer';
  END IF;
  
  RETURN v_role;
EXCEPTION
  WHEN undefined_object THEN
    RETURN 'viewer';
  WHEN OTHERS THEN
    RAISE WARNING 'Error getting role: %, defaulting to viewer', SQLERRM;
    RETURN 'viewer';
END;
$$ LANGUAGE plpgsql STABLE;

-- Verify auth context is properly set
CREATE OR REPLACE FUNCTION verify_auth_context() 
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_workspace_id UUID;
  v_role TEXT;
  v_warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  v_user_id := auth_user_id();
  v_org_id := auth_org_id();
  v_workspace_id := auth_workspace_id();
  v_role := auth_role();
  
  IF v_user_id IS NULL THEN
    v_warnings := array_append(v_warnings, 'User ID is not set');
  END IF;
  
  IF v_org_id IS NULL THEN
    v_warnings := array_append(v_warnings, 'Organization ID is not set');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', (v_user_id IS NOT NULL AND v_org_id IS NOT NULL),
    'user_id', v_user_id,
    'org_id', v_org_id,
    'workspace_id', v_workspace_id,
    'role', v_role,
    'warnings', CASE WHEN array_length(v_warnings, 1) > 0 THEN v_warnings ELSE NULL END,
    'checked_at', now()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Clear auth context for cleanup/logout
CREATE OR REPLACE FUNCTION clear_auth_context() 
RETURNS JSONB AS $$
BEGIN
  PERFORM set_config('auth.user_id', '', true);
  PERFORM set_config('auth.org_id', '', true);
  PERFORM set_config('auth.workspace_id', '', true);
  PERFORM set_config('auth.role', '', true);
  PERFORM set_config('auth.context_set_at', '', true);
  
  RETURN jsonb_build_object(
    'success', true,
    'cleared_at', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'cleared_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;