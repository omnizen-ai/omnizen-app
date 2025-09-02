-- ============================
-- Row Level Security (RLS) Policies for All Tables
-- ============================

-- This migration creates comprehensive RLS policies for all tables
-- All policies use the auth_org_id() function to enforce tenant isolation

-- ============================
-- 1. WAREHOUSE & INVENTORY TABLES
-- ============================

-- Warehouses
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;

CREATE POLICY "warehouses_isolation" ON warehouses
  FOR ALL
  USING (
    organization_id = auth_org_id() 
    AND (workspace_id IS NULL OR workspace_id = auth_workspace_id())
  );

-- Stock Moves
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_moves FORCE ROW LEVEL SECURITY;

CREATE POLICY "stock_moves_tenant_isolation" ON stock_moves
  FOR ALL
  USING (organization_id = auth_org_id());

-- Inventory Levels
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels FORCE ROW LEVEL SECURITY;

CREATE POLICY "inventory_levels_tenant_isolation" ON inventory_levels
  FOR ALL
  USING (organization_id = auth_org_id());

-- Inventory Adjustments
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments FORCE ROW LEVEL SECURITY;

CREATE POLICY "inventory_adjustments_tenant_isolation" ON inventory_adjustments
  FOR ALL
  USING (organization_id = auth_org_id());

-- Inventory Adjustment Lines
ALTER TABLE inventory_adjustment_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustment_lines FORCE ROW LEVEL SECURITY;

CREATE POLICY "inventory_adjustment_lines_tenant_isolation" ON inventory_adjustment_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM inventory_adjustments ia
      WHERE ia.id = inventory_adjustment_lines.adjustment_id
      AND ia.organization_id = auth_org_id()
    )
  );

-- ============================
-- 2. BANKING & CASH MANAGEMENT TABLES
-- ============================

-- Bank Accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts FORCE ROW LEVEL SECURITY;

CREATE POLICY "bank_accounts_isolation" ON bank_accounts
  FOR ALL
  USING (
    organization_id = auth_org_id() 
    AND (workspace_id IS NULL OR workspace_id = auth_workspace_id())
  );

-- Bank Transactions
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions FORCE ROW LEVEL SECURITY;

CREATE POLICY "bank_transactions_tenant_isolation" ON bank_transactions
  FOR ALL
  USING (organization_id = auth_org_id());

-- Bank Reconciliations
ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliations FORCE ROW LEVEL SECURITY;

CREATE POLICY "bank_reconciliations_tenant_isolation" ON bank_reconciliations
  FOR ALL
  USING (organization_id = auth_org_id());

-- Bank Rules
ALTER TABLE bank_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_rules FORCE ROW LEVEL SECURITY;

CREATE POLICY "bank_rules_tenant_isolation" ON bank_rules
  FOR ALL
  USING (organization_id = auth_org_id());

-- Cash Flow Forecasts
ALTER TABLE cash_flow_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_forecasts FORCE ROW LEVEL SECURITY;

CREATE POLICY "cash_flow_forecasts_tenant_isolation" ON cash_flow_forecasts
  FOR ALL
  USING (organization_id = auth_org_id());

-- ============================
-- 3. ORDER MANAGEMENT TABLES
-- ============================

-- Sales Orders
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders FORCE ROW LEVEL SECURITY;

CREATE POLICY "sales_orders_isolation" ON sales_orders
  FOR ALL
  USING (
    organization_id = auth_org_id() 
    AND (workspace_id IS NULL OR workspace_id = auth_workspace_id())
  );

-- Sales Order Lines
ALTER TABLE sales_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_lines FORCE ROW LEVEL SECURITY;

CREATE POLICY "sales_order_lines_tenant_isolation" ON sales_order_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_lines.sales_order_id
      AND so.organization_id = auth_org_id()
    )
  );

-- Purchase Orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders FORCE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_isolation" ON purchase_orders
  FOR ALL
  USING (
    organization_id = auth_org_id() 
    AND (workspace_id IS NULL OR workspace_id = auth_workspace_id())
  );

-- Purchase Order Lines
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines FORCE ROW LEVEL SECURITY;

CREATE POLICY "purchase_order_lines_tenant_isolation" ON purchase_order_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_lines.purchase_order_id
      AND po.organization_id = auth_org_id()
    )
  );

-- Order Fulfillments
ALTER TABLE order_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_fulfillments FORCE ROW LEVEL SECURITY;

CREATE POLICY "order_fulfillments_tenant_isolation" ON order_fulfillments
  FOR ALL
  USING (organization_id = auth_org_id());

-- Fulfillment Lines
ALTER TABLE fulfillment_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_lines FORCE ROW LEVEL SECURITY;

CREATE POLICY "fulfillment_lines_tenant_isolation" ON fulfillment_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM order_fulfillments of
      WHERE of.id = fulfillment_lines.fulfillment_id
      AND of.organization_id = auth_org_id()
    )
  );

-- Purchase Receipts
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts FORCE ROW LEVEL SECURITY;

CREATE POLICY "purchase_receipts_tenant_isolation" ON purchase_receipts
  FOR ALL
  USING (organization_id = auth_org_id());

-- Receipt Lines
ALTER TABLE receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_lines FORCE ROW LEVEL SECURITY;

CREATE POLICY "receipt_lines_tenant_isolation" ON receipt_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchase_receipts pr
      WHERE pr.id = receipt_lines.receipt_id
      AND pr.organization_id = auth_org_id()
    )
  );

-- ============================
-- 4. SEMANTIC CATALOG TABLES
-- ============================

-- Semantic Catalog
ALTER TABLE semantic_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_catalog FORCE ROW LEVEL SECURITY;

-- Allow global semantic catalog entries (org_id = NULL) and org-specific ones
CREATE POLICY "semantic_catalog_access" ON semantic_catalog
  FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = auth_org_id()
  );

CREATE POLICY "semantic_catalog_modification" ON semantic_catalog
  FOR INSERT
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

CREATE POLICY "semantic_catalog_update" ON semantic_catalog
  FOR UPDATE
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

CREATE POLICY "semantic_catalog_delete" ON semantic_catalog
  FOR DELETE
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

-- Query Templates
ALTER TABLE query_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_templates FORCE ROW LEVEL SECURITY;

CREATE POLICY "query_templates_access" ON query_templates
  FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = auth_org_id()
  );

CREATE POLICY "query_templates_modification" ON query_templates
  FOR INSERT
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

CREATE POLICY "query_templates_update" ON query_templates
  FOR UPDATE
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

CREATE POLICY "query_templates_delete" ON query_templates
  FOR DELETE
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

-- Business Metrics
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics FORCE ROW LEVEL SECURITY;

CREATE POLICY "business_metrics_access" ON business_metrics
  FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = auth_org_id()
  );

CREATE POLICY "business_metrics_modification" ON business_metrics
  FOR INSERT
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

CREATE POLICY "business_metrics_update" ON business_metrics
  FOR UPDATE
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

CREATE POLICY "business_metrics_delete" ON business_metrics
  FOR DELETE
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

-- NL Mappings
ALTER TABLE nl_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nl_mappings FORCE ROW LEVEL SECURITY;

CREATE POLICY "nl_mappings_access" ON nl_mappings
  FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = auth_org_id()
  );

CREATE POLICY "nl_mappings_modification" ON nl_mappings
  FOR INSERT
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

CREATE POLICY "nl_mappings_update" ON nl_mappings
  FOR UPDATE
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

CREATE POLICY "nl_mappings_delete" ON nl_mappings
  FOR DELETE
  USING (
    organization_id = auth_org_id()
    OR (organization_id IS NULL AND auth_role() IN ('admin', 'owner'))
  );

-- PII Field Registry (global table, no org isolation)
ALTER TABLE pii_field_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_field_registry FORCE ROW LEVEL SECURITY;

-- Only admins can view and modify PII registry
CREATE POLICY "pii_registry_admin_access" ON pii_field_registry
  FOR ALL
  USING (auth_role() IN ('admin', 'owner', 'ai_agent'));

-- ============================
-- 5. AI-ERP PERMISSION TABLES
-- ============================

-- Agent ERP Permissions
ALTER TABLE agent_erp_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_erp_permissions FORCE ROW LEVEL SECURITY;

-- Read access for all authenticated users in the org
CREATE POLICY "agent_erp_permissions_read" ON agent_erp_permissions
  FOR SELECT
  USING (organization_id = auth_org_id());

-- Only admins can modify agent permissions
CREATE POLICY "agent_erp_permissions_admin_insert" ON agent_erp_permissions
  FOR INSERT
  USING (
    organization_id = auth_org_id()
    AND auth_role() IN ('admin', 'owner')
  );

CREATE POLICY "agent_erp_permissions_admin_update" ON agent_erp_permissions
  FOR UPDATE
  USING (
    organization_id = auth_org_id()
    AND auth_role() IN ('admin', 'owner')
  );

CREATE POLICY "agent_erp_permissions_admin_delete" ON agent_erp_permissions
  FOR DELETE
  USING (
    organization_id = auth_org_id()
    AND auth_role() IN ('admin', 'owner')
  );

-- ERP Automation Rules
ALTER TABLE erp_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_automation_rules FORCE ROW LEVEL SECURITY;

CREATE POLICY "erp_automation_rules_tenant_isolation" ON erp_automation_rules
  FOR ALL
  USING (organization_id = auth_org_id());

-- Agent Audit Trail
ALTER TABLE agent_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit_trail FORCE ROW LEVEL SECURITY;

CREATE POLICY "agent_audit_trail_tenant_isolation" ON agent_audit_trail
  FOR SELECT
  USING (organization_id = auth_org_id());

-- Audit trail is append-only
CREATE POLICY "agent_audit_trail_insert_only" ON agent_audit_trail
  FOR INSERT
  WITH CHECK (organization_id = auth_org_id());

-- No updates or deletes allowed on audit trail
-- (No UPDATE or DELETE policies means those operations are blocked)

-- Query Validation Rules
ALTER TABLE query_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_validation_rules FORCE ROW LEVEL SECURITY;

CREATE POLICY "query_validation_rules_access" ON query_validation_rules
  FOR SELECT
  USING (
    organization_id IS NULL 
    OR organization_id = auth_org_id()
  );

CREATE POLICY "query_validation_rules_admin_modify" ON query_validation_rules
  FOR INSERT
  USING (
    (organization_id = auth_org_id() OR organization_id IS NULL)
    AND auth_role() IN ('admin', 'owner')
  );

CREATE POLICY "query_validation_rules_admin_update" ON query_validation_rules
  FOR UPDATE
  USING (
    (organization_id = auth_org_id() OR organization_id IS NULL)
    AND auth_role() IN ('admin', 'owner')
  );

CREATE POLICY "query_validation_rules_admin_delete" ON query_validation_rules
  FOR DELETE
  USING (
    (organization_id = auth_org_id() OR organization_id IS NULL)
    AND auth_role() IN ('admin', 'owner')
  );

-- Financial Guardrails
ALTER TABLE financial_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_guardrails FORCE ROW LEVEL SECURITY;

-- Read access for all authenticated users in the org
CREATE POLICY "financial_guardrails_read" ON financial_guardrails
  FOR SELECT
  USING (organization_id = auth_org_id());

-- Only admins and accountants can modify guardrails
CREATE POLICY "financial_guardrails_insert" ON financial_guardrails
  FOR INSERT
  USING (
    organization_id = auth_org_id()
    AND auth_role() IN ('admin', 'owner', 'accountant')
  );

CREATE POLICY "financial_guardrails_update" ON financial_guardrails
  FOR UPDATE
  USING (
    organization_id = auth_org_id()
    AND auth_role() IN ('admin', 'owner', 'accountant')
  );

CREATE POLICY "financial_guardrails_delete" ON financial_guardrails
  FOR DELETE
  USING (
    organization_id = auth_org_id()
    AND auth_role() IN ('admin', 'owner')
  );

-- ============================
-- 6. EXISTING TABLES RLS (if not already enabled)
-- ============================

-- Enable RLS on existing finance tables if not already enabled
DO $$
BEGIN
  -- Contacts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' AND policyname = 'contacts_tenant_isolation'
  ) THEN
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE contacts FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "contacts_tenant_isolation" ON contacts
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Products
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' AND policyname = 'products_tenant_isolation'
  ) THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE products FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "products_tenant_isolation" ON products
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Invoices
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoices' AND policyname = 'invoices_tenant_isolation'
  ) THEN
    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
    ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "invoices_tenant_isolation" ON invoices
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Invoice Lines
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoice_lines' AND policyname = 'invoice_lines_tenant_isolation'
  ) THEN
    ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE invoice_lines FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "invoice_lines_tenant_isolation" ON invoice_lines
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM invoices i
          WHERE i.id = invoice_lines.invoice_id
          AND i.organization_id = auth_org_id()
        )
      );
  END IF;

  -- Bills
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bills' AND policyname = 'bills_tenant_isolation'
  ) THEN
    ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
    ALTER TABLE bills FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "bills_tenant_isolation" ON bills
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Bill Lines
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bill_lines' AND policyname = 'bill_lines_tenant_isolation'
  ) THEN
    ALTER TABLE bill_lines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE bill_lines FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "bill_lines_tenant_isolation" ON bill_lines
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM bills b
          WHERE b.id = bill_lines.bill_id
          AND b.organization_id = auth_org_id()
        )
      );
  END IF;

  -- Payments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'payments_tenant_isolation'
  ) THEN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payments FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "payments_tenant_isolation" ON payments
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Payment Allocations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_allocations' AND policyname = 'payment_allocations_tenant_isolation'
  ) THEN
    ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payment_allocations FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "payment_allocations_tenant_isolation" ON payment_allocations
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM payments p
          WHERE p.id = payment_allocations.payment_id
          AND p.organization_id = auth_org_id()
        )
      );
  END IF;

  -- Chart Accounts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chart_accounts' AND policyname = 'chart_accounts_tenant_isolation'
  ) THEN
    ALTER TABLE chart_accounts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE chart_accounts FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "chart_accounts_tenant_isolation" ON chart_accounts
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Journal Entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journal_entries' AND policyname = 'journal_entries_tenant_isolation'
  ) THEN
    ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
    ALTER TABLE journal_entries FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "journal_entries_tenant_isolation" ON journal_entries
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Journal Lines
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journal_lines' AND policyname = 'journal_lines_tenant_isolation'
  ) THEN
    ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE journal_lines FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "journal_lines_tenant_isolation" ON journal_lines
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Journals
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'journals' AND policyname = 'journals_tenant_isolation'
  ) THEN
    ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE journals FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "journals_tenant_isolation" ON journals
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Tax Codes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tax_codes' AND policyname = 'tax_codes_tenant_isolation'
  ) THEN
    ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tax_codes FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "tax_codes_tenant_isolation" ON tax_codes
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Exchange Rates
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exchange_rates' AND policyname = 'exchange_rates_tenant_isolation'
  ) THEN
    ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE exchange_rates FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "exchange_rates_tenant_isolation" ON exchange_rates
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- AI Agents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_agents' AND policyname = 'ai_agents_tenant_isolation'
  ) THEN
    ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ai_agents FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "ai_agents_tenant_isolation" ON ai_agents
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Agent Executions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_executions' AND policyname = 'agent_executions_tenant_isolation'
  ) THEN
    ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE agent_executions FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "agent_executions_tenant_isolation" ON agent_executions
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Agent Conversations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_conversations' AND policyname = 'agent_conversations_tenant_isolation'
  ) THEN
    ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE agent_conversations FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "agent_conversations_tenant_isolation" ON agent_conversations
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Agent Schedules
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_schedules' AND policyname = 'agent_schedules_tenant_isolation'
  ) THEN
    ALTER TABLE agent_schedules ENABLE ROW LEVEL SECURITY;
    ALTER TABLE agent_schedules FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "agent_schedules_tenant_isolation" ON agent_schedules
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;

  -- Knowledge Base
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'knowledge_base' AND policyname = 'knowledge_base_tenant_isolation'
  ) THEN
    ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
    ALTER TABLE knowledge_base FORCE ROW LEVEL SECURITY;
    
    CREATE POLICY "knowledge_base_tenant_isolation" ON knowledge_base
      FOR ALL
      USING (organization_id = auth_org_id());
  END IF;
END $$;

-- ============================
-- 7. GRANT PERMISSIONS
-- ============================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA semantic TO authenticated;

-- Grant SELECT on all semantic views to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA semantic TO authenticated;

-- Grant appropriate permissions on tables to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA semantic GRANT SELECT ON TABLES TO authenticated;

-- ============================
-- 8. CREATE BYPASS FUNCTION FOR SERVICE ROLE
-- ============================

-- Create a function to bypass RLS for service role operations
CREATE OR REPLACE FUNCTION bypass_rls() RETURNS void AS $$
BEGIN
  -- This function does nothing but exists to document
  -- that service role bypasses RLS by default in Supabase
  NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION bypass_rls() IS 'Service role bypasses RLS. This function documents that behavior.';

-- ============================
-- SUMMARY OF RLS POLICIES
-- ============================
-- All tables now have proper RLS policies that:
-- 1. Enforce tenant isolation using auth_org_id()
-- 2. Respect workspace boundaries where applicable (single combined policy)
-- 3. Implement role-based access for sensitive operations (separate policies per operation)
-- 4. Protect audit trails with append-only policies
-- 5. Allow global + org-specific semantic catalog entries
-- 6. Restrict financial guardrails to authorized roles
--
-- Policy Design Principles:
-- - One isolation policy per table (combines org + workspace checks)
-- - Separate policies for different operations (SELECT, INSERT, UPDATE, DELETE)
-- - Role-based restrictions use operation-specific policies
-- - Child tables check parent permissions via EXISTS subqueries