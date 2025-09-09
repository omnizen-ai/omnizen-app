-- ============================
-- Fix Organization Members Auto Context
-- ============================
-- 
-- Remove organization_members from the auto_set_auth_context trigger because:
-- 1. It defines organization relationships (doesn't inherit them)
-- 2. It's a foundational table that should have explicit organizationId
-- 3. During user registration, no RLS context exists yet (we're creating it)
-- 4. This eliminates harmless but noisy warnings during registration

-- ============================
-- UPDATE TRIGGER FUNCTION
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
    -- REMOVED: organization_members (defines org relationships, doesn't inherit them)
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
      'workspaces', 'audit_logs', 'query_intelligence',
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

    -- Set user_id fields (created_by, user_id, etc.) if they exist and are NULL
    -- This applies to all tables
    IF _user_id IS NOT NULL THEN
      -- Try to set created_by
      BEGIN
        IF NEW.created_by IS NULL THEN
          NEW.created_by := _user_id;
        END IF;
      EXCEPTION
        WHEN undefined_column THEN NULL;
      END;
      
      -- Try to set user_id (for tables that track user directly)
      BEGIN
        IF NEW.user_id IS NULL THEN
          NEW.user_id := _user_id;
        END IF;
      EXCEPTION
        WHEN undefined_column THEN NULL;
      END;
    END IF;

    -- Set workspace_id if we have workspace context and column exists
    IF _workspace_id IS NOT NULL THEN
      BEGIN
        IF NEW.workspace_id IS NULL THEN
          NEW.workspace_id := _workspace_id;
        END IF;
      EXCEPTION
        WHEN undefined_column THEN NULL;
      END;
    END IF;

  END IF;

  -- For UPDATE operations: Only update updated_by and updated_at
  IF TG_OP = 'UPDATE' THEN
    IF _user_id IS NOT NULL THEN
      BEGIN
        NEW.updated_by := _user_id;
      EXCEPTION
        WHEN undefined_column THEN NULL;
      END;
    END IF;
    
    -- Set updated_at timestamp
    BEGIN
      NEW.updated_at := NOW();
    EXCEPTION
      WHEN undefined_column THEN NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_set_auth_context() IS 'Automatically sets auth context fields (organization_id, user_id, workspace_id, created_by, updated_by) during INSERT/UPDATE operations. organization_members table excluded as it defines org relationships rather than inheriting them.';