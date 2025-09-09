-- ============================
-- Missing RLS Policies Migration
-- ============================

-- This migration adds RLS policies for critical tables that were missing them
-- Ensures AI tools and UI both respect organization boundaries consistently

-- ============================
-- 1. ORGANIZATIONS TABLE (Critical Priority)
-- ============================

-- Organizations table RLS - users can only access organizations they are members of
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

CREATE POLICY "organizations_member_access" ON organizations
FOR ALL
TO public
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth_user_id() 
    AND is_active = true
  )
);

-- ============================
-- 2. BUSINESS TABLES RLS (High Priority)
-- ============================

-- Sales Quotations
ALTER TABLE sales_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quotations FORCE ROW LEVEL SECURITY;

CREATE POLICY "sales_quotations_tenant_isolation" ON sales_quotations
FOR ALL
TO public
USING (
  organization_id = auth_org_id() 
  AND (workspace_id IS NULL OR workspace_id = auth_workspace_id())
);

-- Quotation Lines (through parent quotation)
ALTER TABLE quotation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_lines FORCE ROW LEVEL SECURITY;

CREATE POLICY "quotation_lines_tenant_isolation" ON quotation_lines
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM sales_quotations sq 
    WHERE sq.id = quotation_lines.quotation_id 
    AND sq.organization_id = auth_org_id()
  )
);

-- Workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_tenant_isolation" ON workspaces
FOR ALL
TO public
USING (organization_id = auth_org_id());

-- ============================
-- 3. SECURITY TABLES RLS (Medium Priority)
-- ============================

-- Organization Members - users can only see their own memberships
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;

CREATE POLICY "organization_members_own_access" ON organization_members
FOR ALL
TO public
USING (user_id = auth_user_id());

-- Audit Logs (if they have organization_id column)
-- Check if audit_logs has organization_id column before applying RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'organization_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
    
    EXECUTE 'CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs
    FOR ALL
    TO public
    USING (organization_id = auth_org_id())';
  END IF;
END $$;

-- ============================
-- VERIFICATION QUERIES
-- ============================

-- The following queries can be used to verify RLS is working:
-- (These are comments for reference, not executed)

/*
-- Test organizations RLS:
-- SET auth.user_id = 'a99f770b-3512-4772-a385-086922ebe58e';
-- SELECT name FROM organizations; -- Should only show user's organizations

-- Test quotations RLS:  
-- SET auth.org_id = '1ebee096-8d53-455a-8949-c6ff2f0aea89';
-- SELECT COUNT(*) FROM sales_quotations; -- Should only show org's quotations
*/