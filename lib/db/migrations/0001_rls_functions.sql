-- Create RLS helper functions for dual auth system
-- These functions allow NextAuth sessions to set context for Supabase RLS

CREATE OR REPLACE FUNCTION set_auth_context(
  p_user_id UUID,
  p_org_id UUID,
  p_workspace_id UUID DEFAULT NULL,
  p_role TEXT DEFAULT 'employee'
) RETURNS void AS $$
BEGIN
  -- Set session variables for RLS
  PERFORM set_config('auth.user_id', p_user_id::text, true);
  PERFORM set_config('auth.org_id', p_org_id::text, true);
  PERFORM set_config('auth.workspace_id', COALESCE(p_workspace_id::text, ''), true);
  PERFORM set_config('auth.role', p_role, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get organization ID from RLS context
CREATE OR REPLACE FUNCTION auth_org_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('auth.org_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get user ID from RLS context
CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('auth.user_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get workspace ID from RLS context
CREATE OR REPLACE FUNCTION auth_workspace_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('auth.workspace_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get user role from RLS context
CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('auth.role', true);
END;
$$ LANGUAGE plpgsql STABLE;