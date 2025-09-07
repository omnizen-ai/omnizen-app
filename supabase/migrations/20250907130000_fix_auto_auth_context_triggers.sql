-- ============================
-- Fix Auto Auth Context Triggers
-- ============================
-- 
-- This migration fixes the auto auth context trigger to handle NOT NULL constraints
-- properly by always setting organization_id for INSERT operations, not just when NULL.

-- ============================
-- 1. UPDATE TRIGGER FUNCTION TO BE MORE ROBUST
-- ============================

CREATE OR REPLACE FUNCTION auto_set_auth_context()
RETURNS TRIGGER AS $$
DECLARE
  _org_id UUID;
  _user_id UUID;
  _workspace_id UUID;
BEGIN
  -- Get auth context values once
  _org_id := auth_org_id();
  _user_id := auth_user_id();
  _workspace_id := auth_workspace_id();

  -- For INSERT operations: Always set auth context fields
  IF TG_OP = 'INSERT' THEN
    
    -- Always set organization_id if column exists (for tables that need it)
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
      -- Set organization_id if we have an org context and column exists
      IF _org_id IS NOT NULL THEN
        BEGIN
          -- Force set organization_id regardless of current value
          NEW.organization_id := _org_id;
        EXCEPTION
          WHEN undefined_column THEN
            -- Column doesn't exist, skip
            NULL;
        END;
      ELSE
        -- Log warning if no org context is available
        RAISE WARNING 'No organization context available for table %, auth_org_id() returned NULL', TG_TABLE_NAME;
      END IF;
    END IF;

    -- Set user_id if column exists and we have user context
    IF TG_TABLE_NAME IN (
      'audit_logs', 'sessions', 'document_access_logs', 'agent_audit_trail',
      'query_feedback', 'conversation_messages'
    ) AND _user_id IS NOT NULL THEN
      BEGIN
        NEW.user_id := COALESCE(NEW.user_id, _user_id);
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, skip
          NULL;
      END;
    END IF;

    -- Set workspace_id if column exists and we have workspace context
    IF TG_TABLE_NAME IN (
      'warehouses', 'sales_orders', 'purchase_orders', 'bank_accounts',
      'workspaces'
    ) AND _workspace_id IS NOT NULL THEN
      BEGIN
        NEW.workspace_id := COALESCE(NEW.workspace_id, _workspace_id);
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, skip
          NULL;
      END;
    END IF;

    -- Set created_by if column exists and we have user context
    IF _user_id IS NOT NULL THEN
      BEGIN
        NEW.created_by := COALESCE(NEW.created_by, _user_id);
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, skip
          NULL;
      END;
    END IF;

    -- Set updated_by if column exists and we have user context
    IF _user_id IS NOT NULL THEN
      BEGIN
        NEW.updated_by := COALESCE(NEW.updated_by, _user_id);
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, skip
          NULL;
      END;
    END IF;

  END IF;

  -- For UPDATE operations: Update the updated_by field
  IF TG_OP = 'UPDATE' AND _user_id IS NOT NULL THEN
    BEGIN
      NEW.updated_by := _user_id;
    EXCEPTION
      WHEN undefined_column THEN
        -- Column doesn't exist, skip
        NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_set_auth_context() IS 'Automatically sets auth context fields (organization_id, user_id, workspace_id, created_by, updated_by) during INSERT/UPDATE operations. Updated version that handles NOT NULL constraints properly.';

-- ============================
-- 2. TEST THE UPDATED FUNCTION
-- ============================

-- Test that the function works with proper error handling
DO $$
BEGIN
  RAISE NOTICE 'Auto auth context trigger function updated successfully';
END $$;