-- ============================
-- Auto Auth Context Triggers
-- ============================
-- 
-- This migration creates a universal trigger function that automatically
-- sets auth context fields (organization_id, user_id, workspace_id)
-- during INSERT operations when they are not explicitly provided.
--
-- This solves the issue where AI agents can read data through RLS but
-- fail on INSERT/UPDATE operations without explicit organization_id.

-- ============================
-- 1. CREATE UNIVERSAL TRIGGER FUNCTION
-- ============================

CREATE OR REPLACE FUNCTION auto_set_auth_context()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT operations: Set auth context fields if they are NULL or not provided
  IF TG_OP = 'INSERT' THEN
    
    -- Set organization_id if column exists and is NULL
    IF TG_TABLE_NAME IN (
      'contacts', 'products', 'invoices', 'invoice_lines', 'bills', 'bill_lines', 
      'payments', 'payment_allocations', 'chart_accounts', 'journals', 'journal_entries', 
      'journal_lines', 'currencies', 'exchange_rates', 'tax_codes',
      'warehouses', 'stock_moves', 'inventory_levels', 'inventory_adjustments', 
      'inventory_adjustment_lines', 'sales_orders', 'sales_order_lines', 
      'purchase_orders', 'purchase_order_lines', 'order_fulfillments', 
      'fulfillment_lines', 'purchase_receipts', 'receipt_lines',
      'bank_accounts', 'bank_transactions', 'bank_reconciliations',
      'bank_rules', 'cash_flow_forecasts', 'ai_agents', 'agent_executions',
      'agent_conversations', 'conversation_messages', 'agent_schedules',
      'agent_erp_permissions', 'erp_automation_rules', 'agent_audit_trail',
      'query_validation_rules', 'financial_guardrails', 'documents',
      'document_embeddings', 'document_processing_jobs', 'document_access_logs',
      'workspaces', 'organization_members', 'audit_logs', 'query_intelligence',
      'query_evolution', 'query_batch_jobs', 'query_patterns', 'query_feedback',
      'personal_categories', 'financial_goals', 'budget_rules', 'investment_holdings',
      'personal_subscriptions'
    ) THEN
      -- Check if organization_id column exists and is NULL
      BEGIN
        IF NEW.organization_id IS NULL THEN
          NEW.organization_id := auth_org_id();
        END IF;
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, skip
          NULL;
      END;
    END IF;

    -- Set user_id if column exists and is NULL
    -- Tables that typically have user_id: audit_logs, sessions, document_access_logs, etc.
    IF TG_TABLE_NAME IN (
      'audit_logs', 'sessions', 'document_access_logs', 'agent_audit_trail',
      'query_feedback', 'conversation_messages'
    ) THEN
      BEGIN
        IF NEW.user_id IS NULL THEN
          NEW.user_id := auth_user_id();
        END IF;
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, skip
          NULL;
      END;
    END IF;

    -- Set workspace_id if column exists and is NULL
    -- Tables that support workspace isolation
    IF TG_TABLE_NAME IN (
      'warehouses', 'sales_orders', 'purchase_orders', 'bank_accounts',
      'workspaces'
    ) THEN
      BEGIN
        IF NEW.workspace_id IS NULL THEN
          NEW.workspace_id := auth_workspace_id();
        END IF;
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, skip
          NULL;
      END;
    END IF;

    -- Set created_by if column exists and is NULL
    BEGIN
      IF NEW.created_by IS NULL THEN
        NEW.created_by := auth_user_id();
      END IF;
    EXCEPTION
      WHEN undefined_column THEN
        -- Column doesn't exist, skip
        NULL;
    END;

    -- Set updated_by if column exists and is NULL
    BEGIN
      IF NEW.updated_by IS NULL THEN
        NEW.updated_by := auth_user_id();
      END IF;
    EXCEPTION
      WHEN undefined_column THEN
        -- Column doesn't exist, skip
        NULL;
    END;

  END IF;

  -- For UPDATE operations: Update the updated_by field
  IF TG_OP = 'UPDATE' THEN
    BEGIN
      NEW.updated_by := auth_user_id();
    EXCEPTION
      WHEN undefined_column THEN
        -- Column doesn't exist, skip
        NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_set_auth_context() IS 'Automatically sets auth context fields (organization_id, user_id, workspace_id, created_by, updated_by) during INSERT/UPDATE operations when they are NULL.';

-- ============================
-- 2. APPLY TRIGGERS TO ALL RELEVANT TABLES
-- ============================

-- Core Tables
CREATE TRIGGER auto_auth_context_workspaces 
  BEFORE INSERT OR UPDATE ON workspaces 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_organization_members 
  BEFORE INSERT OR UPDATE ON organization_members 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_audit_logs 
  BEFORE INSERT OR UPDATE ON audit_logs 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- Finance Tables
CREATE TRIGGER auto_auth_context_contacts 
  BEFORE INSERT OR UPDATE ON contacts 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_products 
  BEFORE INSERT OR UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_invoices 
  BEFORE INSERT OR UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_invoice_lines 
  BEFORE INSERT OR UPDATE ON invoice_lines 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_bills 
  BEFORE INSERT OR UPDATE ON bills 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_bill_lines 
  BEFORE INSERT OR UPDATE ON bill_lines 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_payments 
  BEFORE INSERT OR UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_payment_allocations 
  BEFORE INSERT OR UPDATE ON payment_allocations 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_chart_accounts 
  BEFORE INSERT OR UPDATE ON chart_accounts 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_journals 
  BEFORE INSERT OR UPDATE ON journals 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_journal_entries 
  BEFORE INSERT OR UPDATE ON journal_entries 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_journal_lines 
  BEFORE INSERT OR UPDATE ON journal_lines 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_currencies 
  BEFORE INSERT OR UPDATE ON currencies 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_exchange_rates 
  BEFORE INSERT OR UPDATE ON exchange_rates 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_tax_codes 
  BEFORE INSERT OR UPDATE ON tax_codes 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- Warehouse Tables
CREATE TRIGGER auto_auth_context_warehouses 
  BEFORE INSERT OR UPDATE ON warehouses 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_stock_moves 
  BEFORE INSERT OR UPDATE ON stock_moves 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_inventory_levels 
  BEFORE INSERT OR UPDATE ON inventory_levels 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_inventory_adjustments 
  BEFORE INSERT OR UPDATE ON inventory_adjustments 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_inventory_adjustment_lines 
  BEFORE INSERT OR UPDATE ON inventory_adjustment_lines 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- Order Tables
CREATE TRIGGER auto_auth_context_sales_orders 
  BEFORE INSERT OR UPDATE ON sales_orders 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_sales_order_lines 
  BEFORE INSERT OR UPDATE ON sales_order_lines 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_purchase_orders 
  BEFORE INSERT OR UPDATE ON purchase_orders 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_purchase_order_lines 
  BEFORE INSERT OR UPDATE ON purchase_order_lines 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_order_fulfillments 
  BEFORE INSERT OR UPDATE ON order_fulfillments 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_fulfillment_lines 
  BEFORE INSERT OR UPDATE ON fulfillment_lines 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_purchase_receipts 
  BEFORE INSERT OR UPDATE ON purchase_receipts 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_receipt_lines 
  BEFORE INSERT OR UPDATE ON receipt_lines 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- Note: sales_quotations and quotation_lines tables don't exist yet, skipping triggers for now
-- Will be added when these tables are created

-- Banking Tables
CREATE TRIGGER auto_auth_context_bank_accounts 
  BEFORE INSERT OR UPDATE ON bank_accounts 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_bank_transactions 
  BEFORE INSERT OR UPDATE ON bank_transactions 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_bank_reconciliations 
  BEFORE INSERT OR UPDATE ON bank_reconciliations 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_bank_rules 
  BEFORE INSERT OR UPDATE ON bank_rules 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_cash_flow_forecasts 
  BEFORE INSERT OR UPDATE ON cash_flow_forecasts 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- AI Tables
CREATE TRIGGER auto_auth_context_ai_agents 
  BEFORE INSERT OR UPDATE ON ai_agents 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_agent_executions 
  BEFORE INSERT OR UPDATE ON agent_executions 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_agent_conversations 
  BEFORE INSERT OR UPDATE ON agent_conversations 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_conversation_messages 
  BEFORE INSERT OR UPDATE ON conversation_messages 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_agent_schedules 
  BEFORE INSERT OR UPDATE ON agent_schedules 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_agent_erp_permissions 
  BEFORE INSERT OR UPDATE ON agent_erp_permissions 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_erp_automation_rules 
  BEFORE INSERT OR UPDATE ON erp_automation_rules 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_agent_audit_trail 
  BEFORE INSERT OR UPDATE ON agent_audit_trail 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_query_validation_rules 
  BEFORE INSERT OR UPDATE ON query_validation_rules 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_financial_guardrails 
  BEFORE INSERT OR UPDATE ON financial_guardrails 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- Document Tables
CREATE TRIGGER auto_auth_context_documents 
  BEFORE INSERT OR UPDATE ON documents 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_document_embeddings 
  BEFORE INSERT OR UPDATE ON document_embeddings 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_document_processing_jobs 
  BEFORE INSERT OR UPDATE ON document_processing_jobs 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_document_access_logs 
  BEFORE INSERT OR UPDATE ON document_access_logs 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- Query Intelligence Tables
CREATE TRIGGER auto_auth_context_query_intelligence 
  BEFORE INSERT OR UPDATE ON query_intelligence 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_query_evolution 
  BEFORE INSERT OR UPDATE ON query_evolution 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_query_batch_jobs 
  BEFORE INSERT OR UPDATE ON query_batch_jobs 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_query_patterns 
  BEFORE INSERT OR UPDATE ON query_patterns 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_query_feedback 
  BEFORE INSERT OR UPDATE ON query_feedback 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- Personal Finance Tables
CREATE TRIGGER auto_auth_context_personal_categories 
  BEFORE INSERT OR UPDATE ON personal_categories 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_financial_goals 
  BEFORE INSERT OR UPDATE ON financial_goals 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_budget_rules 
  BEFORE INSERT OR UPDATE ON budget_rules 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_investment_holdings 
  BEFORE INSERT OR UPDATE ON investment_holdings 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

CREATE TRIGGER auto_auth_context_personal_subscriptions 
  BEFORE INSERT OR UPDATE ON personal_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION auto_set_auth_context();

-- Semantic Tables (optional organization_id)
-- These triggers will only set organization_id if the table has the column

-- Note: We skip semantic_catalog, query_templates, business_metrics, nl_mappings
-- because they can be global (organization_id IS NULL) or org-specific.
-- The existing RLS policies handle this correctly.

-- ============================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================

-- Add indexes on commonly used auth context columns if they don't exist
-- These help with RLS policy performance

DO $$
BEGIN
  -- Index on organization_id for major tables (if not exists)
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_org_id') THEN
    CREATE INDEX idx_invoices_org_id ON invoices(organization_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_org_id') THEN
    CREATE INDEX idx_contacts_org_id ON contacts(organization_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_org_id') THEN
    CREATE INDEX idx_products_org_id ON products(organization_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_orders_org_id') THEN
    CREATE INDEX idx_sales_orders_org_id ON sales_orders(organization_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchase_orders_org_id') THEN
    CREATE INDEX idx_purchase_orders_org_id ON purchase_orders(organization_id);
  END IF;
END $$;

-- ============================
-- SUMMARY
-- ============================
-- 
-- This migration:
-- 1. Creates a universal trigger function that automatically sets auth context fields
-- 2. Applies BEFORE INSERT/UPDATE triggers to all relevant tables
-- 3. Handles missing columns gracefully using exception handling
-- 4. Sets organization_id, user_id, workspace_id, created_by, updated_by as appropriate
-- 5. Maintains compatibility with existing RLS policies
-- 6. Adds performance indexes for auth context columns
--
-- Result: AI agents can now perform INSERT operations without explicitly 
-- providing organization_id - it will be automatically set from the auth context.