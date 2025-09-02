-- ============================
-- Personal Finance Semantic Views for AI Agent Consumption
-- ============================
-- These views provide personal finance insights optimized for LLM queries
-- All views respect RLS through auth_org_id() and auth_workspace_id() functions
-- Note: Fixed to use correct table and column names from migrations

-- ============================
-- 1. Personal Budget Performance View  
-- ============================
CREATE OR REPLACE VIEW semantic.v_personal_budget_performance AS
WITH monthly_spending AS (
  -- Get spending from bank transactions through bank accounts to get workspace context
  SELECT 
    bt.organization_id,
    ba.workspace_id,
    DATE_TRUNC('month', bt.transaction_date) AS month,
    bt.category,
    SUM(CASE WHEN bt.amount < 0 THEN -bt.amount ELSE 0 END) AS spent_amount
  FROM bank_transactions bt
  JOIN bank_accounts ba ON ba.id = bt.bank_account_id
  WHERE bt.organization_id = auth_org_id()
    AND ba.workspace_id = auth_workspace_id()
    AND bt.amount < 0 -- Only expenses
  GROUP BY bt.organization_id, ba.workspace_id, DATE_TRUNC('month', bt.transaction_date), bt.category
)
SELECT 
  br.organization_id,
  br.workspace_id,
  ms.month,
  pc.name AS category_name,
  br.budget_amount,
  COALESCE(ms.spent_amount, 0) AS spent_amount,
  br.budget_amount - COALESCE(ms.spent_amount, 0) AS remaining_budget,
  CASE 
    WHEN br.budget_amount > 0 THEN (COALESCE(ms.spent_amount, 0) / br.budget_amount * 100)
    ELSE 0 
  END AS percentage_used,
  CASE
    WHEN COALESCE(ms.spent_amount, 0) > br.budget_amount THEN 'over_budget'
    WHEN COALESCE(ms.spent_amount, 0) > (br.budget_amount * br.alert_threshold / 100) THEN 'warning'
    ELSE 'on_track'
  END AS status
FROM budget_rules br
LEFT JOIN personal_categories pc ON pc.id = br.category_id
LEFT JOIN monthly_spending ms ON ms.category = pc.name 
  AND ms.organization_id = br.organization_id 
  AND ms.workspace_id = br.workspace_id
WHERE br.organization_id = auth_org_id()
  AND br.workspace_id = auth_workspace_id()
  AND br.is_active = true;

COMMENT ON VIEW semantic.v_personal_budget_performance IS 'Personal budget vs actual spending analysis for financial insights';

-- ============================
-- 2. Financial Goals Progress View
-- ============================
CREATE OR REPLACE VIEW semantic.v_financial_goals_progress AS
SELECT 
  fg.organization_id,
  fg.workspace_id,
  fg.id AS goal_id,
  fg.name AS goal_name,
  fg.goal_type,
  fg.target_amount,
  fg.current_amount,
  fg.target_date,
  fg.status,
  fg.target_amount - fg.current_amount AS remaining_amount,
  CASE 
    WHEN fg.target_amount > 0 THEN (fg.current_amount / fg.target_amount * 100)
    ELSE 0 
  END AS completion_percentage,
  CASE
    WHEN fg.target_date IS NOT NULL THEN 
      (fg.target_date - CURRENT_DATE)::integer
    ELSE NULL
  END AS days_remaining,
  CASE
    WHEN fg.target_date IS NOT NULL AND fg.target_date < CURRENT_DATE AND fg.status != 'completed' THEN 'overdue'
    WHEN fg.target_date IS NOT NULL AND fg.target_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'on_track'
  END AS timeline_status
FROM financial_goals fg
WHERE fg.organization_id = auth_org_id()
  AND fg.workspace_id = auth_workspace_id()
  AND fg.status = 'active';

COMMENT ON VIEW semantic.v_financial_goals_progress IS 'Financial goals tracking and progress analysis for personal finance planning';

-- ============================
-- 3. Investment Portfolio Performance View
-- ============================
CREATE OR REPLACE VIEW semantic.v_investment_portfolio AS
SELECT 
  ih.organization_id,
  ih.workspace_id,
  ih.id AS holding_id,
  ih.symbol,
  ih.name AS investment_name,
  ih.asset_type,
  ih.quantity,
  ih.cost_basis,
  ih.current_price,
  ih.market_value,
  ih.unrealized_gain_loss,
  CASE 
    WHEN ih.cost_basis > 0 THEN (ih.unrealized_gain_loss / ih.cost_basis * 100)
    ELSE 0 
  END AS return_percentage,
  ih.last_updated,
  -- Portfolio allocation within workspace
  ih.market_value / NULLIF(SUM(ih.market_value) OVER (
    PARTITION BY ih.organization_id, ih.workspace_id
  ), 0) * 100 AS portfolio_percentage
FROM investment_holdings ih
WHERE ih.organization_id = auth_org_id()
  AND ih.workspace_id = auth_workspace_id()
  AND ih.quantity > 0;

COMMENT ON VIEW semantic.v_investment_portfolio IS 'Investment portfolio holdings and performance analysis for wealth tracking';

-- ============================
-- 4. Monthly Cash Flow Summary View
-- ============================
CREATE OR REPLACE VIEW semantic.v_monthly_cash_flow AS
SELECT 
  bt.organization_id,
  ba.workspace_id,
  DATE_TRUNC('month', bt.transaction_date) AS month,
  SUM(CASE WHEN bt.amount > 0 THEN bt.amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN bt.amount < 0 THEN -bt.amount ELSE 0 END) AS total_expenses,
  SUM(bt.amount) AS net_cash_flow,
  COUNT(*) AS transaction_count,
  -- Top expense categories (only for expenses)
  array_agg(DISTINCT bt.category ORDER BY bt.category) FILTER (WHERE bt.amount < 0) AS expense_categories,
  -- Average transaction size
  AVG(ABS(bt.amount)) AS avg_transaction_size
FROM bank_transactions bt
JOIN bank_accounts ba ON ba.id = bt.bank_account_id
WHERE bt.organization_id = auth_org_id()
  AND ba.workspace_id = auth_workspace_id()
  AND bt.transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY bt.organization_id, ba.workspace_id, DATE_TRUNC('month', bt.transaction_date)
ORDER BY month DESC;

COMMENT ON VIEW semantic.v_monthly_cash_flow IS 'Monthly income vs expenses analysis for cash flow management';

-- ============================
-- 5. Subscription Tracking View
-- ============================
CREATE OR REPLACE VIEW semantic.v_subscription_tracking AS
SELECT 
  ps.organization_id,
  ps.workspace_id,
  ps.id AS subscription_id,
  ps.name AS subscription_name,
  ps.vendor_name,
  pc.name AS category_name,
  pc.icon AS category_icon,
  pc.color AS category_color,
  ps.amount,
  ps.frequency,
  ps.next_billing_date,
  ps.is_active,
  -- Calculate monthly equivalent
  CASE 
    WHEN ps.frequency = 'weekly' THEN ps.amount * 4.33
    WHEN ps.frequency = 'monthly' THEN ps.amount
    WHEN ps.frequency = 'quarterly' THEN ps.amount / 3
    WHEN ps.frequency = 'annual' THEN ps.amount / 12
    ELSE ps.amount
  END AS monthly_equivalent,
  -- Days until next billing
  CASE
    WHEN ps.next_billing_date IS NOT NULL THEN 
      (ps.next_billing_date - CURRENT_DATE)::integer
    ELSE NULL
  END AS days_to_billing,
  -- Status based on billing date
  CASE
    WHEN ps.next_billing_date IS NULL THEN 'unknown'
    WHEN ps.next_billing_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'due_soon'
    WHEN ps.next_billing_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_this_week'
    ELSE 'scheduled'
  END AS billing_status,
  ps.cancellation_url,
  ps.notes
FROM personal_subscriptions ps
LEFT JOIN personal_categories pc ON pc.id = ps.category_id
WHERE ps.organization_id = auth_org_id()
  AND ps.workspace_id = auth_workspace_id()
  AND ps.is_active = true
ORDER BY ps.amount DESC;

COMMENT ON VIEW semantic.v_subscription_tracking IS 'Recurring subscription analysis and management for expense optimization';

-- ============================
-- 6. Personal Account Balances View
-- ============================
CREATE OR REPLACE VIEW semantic.v_personal_account_balances AS
SELECT 
  ba.organization_id,
  ba.workspace_id,
  ba.id AS account_id,
  ba.account_name,
  ba.bank_account_type,
  ba.bank_name,
  ba.current_balance,
  ba.available_balance,
  ba.currency_code,
  ba.last_reconciled_date,
  ba.is_active,
  -- Account status
  CASE
    WHEN NOT ba.is_active THEN 'inactive'
    WHEN ba.last_reconciled_date IS NULL THEN 'never_reconciled'
    WHEN ba.last_reconciled_date < CURRENT_DATE - INTERVAL '30 days' THEN 'needs_reconciliation'
    ELSE 'up_to_date'
  END AS account_status
FROM bank_accounts ba
WHERE ba.organization_id = auth_org_id()
  AND ba.workspace_id = auth_workspace_id()
ORDER BY ba.current_balance DESC;

COMMENT ON VIEW semantic.v_personal_account_balances IS 'Personal bank account balances and status for financial overview';

-- ============================
-- 7. Personal Categories Summary View
-- ============================
CREATE OR REPLACE VIEW semantic.v_personal_categories_summary AS
SELECT 
  pc.organization_id,
  pc.id AS category_id,
  pc.name AS category_name,
  pc.icon,
  pc.color,
  pc.tax_relevant,
  pc.parent_category_id,
  parent.name AS parent_category_name,
  -- Count of subcategories
  (SELECT COUNT(*) FROM personal_categories sub WHERE sub.parent_category_id = pc.id) AS subcategory_count,
  -- Budget rules count
  (SELECT COUNT(*) FROM budget_rules br WHERE br.category_id = pc.id AND br.is_active = true) AS active_budget_rules,
  -- Subscription count
  (SELECT COUNT(*) FROM personal_subscriptions ps WHERE ps.category_id = pc.id AND ps.is_active = true) AS active_subscriptions
FROM personal_categories pc
LEFT JOIN personal_categories parent ON parent.id = pc.parent_category_id
WHERE pc.organization_id = auth_org_id()
ORDER BY pc.name;

COMMENT ON VIEW semantic.v_personal_categories_summary IS 'Personal finance categories with usage statistics';

-- ============================
-- Indexes for Performance
-- ============================
-- These indexes complement Drizzle-created indexes for RLS optimization
-- Composite indexes are crucial for Row Level Security performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_org_account_date ON bank_transactions(organization_id, bank_account_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_category ON bank_transactions(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_org_workspace ON bank_accounts(organization_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_budget_rules_active ON budget_rules(organization_id, workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_financial_goals_active ON financial_goals(organization_id, workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_personal_subscriptions_active ON personal_subscriptions(organization_id, workspace_id, is_active);

-- ============================
-- Grant Permissions
-- ============================
GRANT USAGE ON SCHEMA semantic TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA semantic TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA semantic GRANT SELECT ON TABLES TO authenticated;