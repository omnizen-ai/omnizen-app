-- ============================
-- Semantic Views for AI Agent Consumption
-- ============================
-- These views provide denormalized, business-friendly data for LLM queries
-- All views respect RLS through auth_org_id() function
-- Note: The semantic schema is created in migration 0002_early_groot.sql

-- ============================
-- 1. AR Aging Report View
-- ============================
CREATE OR REPLACE VIEW semantic.v_ar_aging_report AS
SELECT 
  i.organization_id,
  i.id AS invoice_id,
  i.invoice_number,
  i.issue_date,
  i.due_date,
  c.id AS customer_id,
  c.display_name AS customer_name,
  c.email AS customer_email,
  i.currency_code,
  i.total_amount,
  i.paid_amount,
  i.balance_due,
  CURRENT_DATE - i.due_date::date AS days_overdue,
  CASE 
    WHEN i.status IN ('paid', 'void', 'cancelled') THEN 'closed'
    WHEN CURRENT_DATE <= i.due_date::date THEN 'current'
    WHEN CURRENT_DATE - i.due_date::date <= 30 THEN '1-30 days'
    WHEN CURRENT_DATE - i.due_date::date <= 60 THEN '31-60 days'
    WHEN CURRENT_DATE - i.due_date::date <= 90 THEN '61-90 days'
    ELSE 'over 90 days'
  END AS aging_bucket,
  i.status,
  i.po_number,
  i.notes
FROM invoices i
JOIN contacts c ON c.id = i.customer_id
WHERE i.organization_id = auth_org_id()
  AND i.status NOT IN ('draft', 'void', 'cancelled');

COMMENT ON VIEW semantic.v_ar_aging_report IS 'Accounts receivable aging analysis for AI queries about outstanding customer invoices';

-- ============================
-- 2. AP Aging Report View
-- ============================
CREATE OR REPLACE VIEW semantic.v_ap_aging_report AS
SELECT 
  b.organization_id,
  b.id AS bill_id,
  b.bill_number,
  b.vendor_invoice_number,
  b.bill_date,
  b.due_date,
  v.id AS vendor_id,
  v.display_name AS vendor_name,
  v.email AS vendor_email,
  b.currency_code,
  b.total_amount,
  b.paid_amount,
  b.balance_due,
  CURRENT_DATE - b.due_date::date AS days_overdue,
  CASE 
    WHEN b.status IN ('paid', 'void', 'cancelled') THEN 'closed'
    WHEN CURRENT_DATE <= b.due_date::date THEN 'current'
    WHEN CURRENT_DATE - b.due_date::date <= 30 THEN '1-30 days'
    WHEN CURRENT_DATE - b.due_date::date <= 60 THEN '31-60 days'
    WHEN CURRENT_DATE - b.due_date::date <= 90 THEN '61-90 days'
    ELSE 'over 90 days'
  END AS aging_bucket,
  b.status,
  b.po_number,
  b.notes
FROM bills b
JOIN contacts v ON v.id = b.vendor_id
WHERE b.organization_id = auth_org_id()
  AND b.status NOT IN ('draft', 'void', 'cancelled');

COMMENT ON VIEW semantic.v_ap_aging_report IS 'Accounts payable aging analysis for AI queries about outstanding vendor bills';

-- ============================
-- 3. Cash Flow Statement View
-- ============================
CREATE OR REPLACE VIEW semantic.v_cash_flow_statement AS
WITH cash_accounts AS (
  SELECT 
    ca.id,
    ca.organization_id,
    ca.code,
    ca.name,
    ca.current_balance
  FROM chart_accounts ca
  WHERE ca.organization_id = auth_org_id()
    AND ca.type = 'asset'
    AND (ca.code LIKE '1%' OR lower(ca.name) LIKE '%cash%' OR lower(ca.name) LIKE '%bank%')
),
daily_movements AS (
  SELECT 
    je.entry_date::date AS transaction_date,
    ca.id AS account_id,
    ca.name AS account_name,
    SUM(jl.debit::numeric - jl.credit::numeric) AS net_movement
  FROM journal_entries je
  JOIN journal_lines jl ON jl.journal_entry_id = je.id
  JOIN cash_accounts ca ON ca.id = jl.account_id
  WHERE je.organization_id = auth_org_id()
    AND je.status = 'posted'
  GROUP BY je.entry_date::date, ca.id, ca.name
)
SELECT 
  transaction_date,
  account_name,
  net_movement,
  SUM(net_movement) OVER (PARTITION BY account_name ORDER BY transaction_date) AS running_balance,
  CASE 
    WHEN net_movement > 0 THEN 'inflow'
    WHEN net_movement < 0 THEN 'outflow'
    ELSE 'no_change'
  END AS movement_type
FROM daily_movements
ORDER BY transaction_date DESC, account_name;

COMMENT ON VIEW semantic.v_cash_flow_statement IS 'Daily cash flow movements and running balances for AI cash position queries';

-- ============================
-- 4. Profit & Loss Statement View
-- ============================
CREATE OR REPLACE VIEW semantic.v_profit_loss_statement AS
WITH period_transactions AS (
  SELECT 
    ca.type AS account_type,
    ca.code AS account_code,
    ca.name AS account_name,
    DATE_TRUNC('month', je.entry_date) AS period,
    SUM(CASE 
      WHEN ca.type = 'income' THEN jl.credit::numeric - jl.debit::numeric
      WHEN ca.type = 'expense' THEN jl.debit::numeric - jl.credit::numeric
      ELSE 0
    END) AS amount
  FROM journal_entries je
  JOIN journal_lines jl ON jl.journal_entry_id = je.id
  JOIN chart_accounts ca ON ca.id = jl.account_id
  WHERE je.organization_id = auth_org_id()
    AND je.status = 'posted'
    AND ca.type IN ('income', 'expense')
  GROUP BY ca.type, ca.code, ca.name, DATE_TRUNC('month', je.entry_date)
)
SELECT 
  period,
  account_type,
  account_code,
  account_name,
  amount,
  SUM(amount) OVER (PARTITION BY account_type, period) AS type_total,
  SUM(CASE WHEN account_type = 'income' THEN amount ELSE -amount END) 
    OVER (PARTITION BY period) AS net_income
FROM period_transactions
ORDER BY period DESC, account_type, account_code;

COMMENT ON VIEW semantic.v_profit_loss_statement IS 'Monthly P&L breakdown for AI financial performance queries';

-- ============================
-- 5. Balance Sheet View
-- ============================
CREATE OR REPLACE VIEW semantic.v_balance_sheet AS
SELECT 
  ca.type AS account_type,
  CASE 
    WHEN ca.type IN ('asset', 'contra_liability') THEN 'assets'
    WHEN ca.type IN ('liability', 'contra_asset') THEN 'liabilities'
    WHEN ca.type = 'equity' THEN 'equity'
  END AS balance_sheet_section,
  ca.code AS account_code,
  ca.name AS account_name,
  ca.current_balance::numeric AS current_balance,
  ca.normal_balance,
  CASE 
    WHEN ca.type IN ('asset', 'expense') AND ca.normal_balance = 'debit' THEN ca.current_balance::numeric
    WHEN ca.type IN ('liability', 'equity', 'income') AND ca.normal_balance = 'credit' THEN ca.current_balance::numeric
    ELSE -(ca.current_balance::numeric)
  END AS adjusted_balance
FROM chart_accounts ca
WHERE ca.organization_id = auth_org_id()
  AND ca.type IN ('asset', 'liability', 'equity', 'contra_asset', 'contra_liability')
  AND ca.is_active = true
ORDER BY 
  CASE ca.type
    WHEN 'asset' THEN 1
    WHEN 'contra_asset' THEN 2
    WHEN 'liability' THEN 3
    WHEN 'contra_liability' THEN 4
    WHEN 'equity' THEN 5
  END,
  ca.code;

COMMENT ON VIEW semantic.v_balance_sheet IS 'Current balance sheet positions for AI financial position queries';

-- ============================
-- 6. KPI Dashboard View
-- ============================
CREATE OR REPLACE VIEW semantic.v_kpi_dashboard AS
WITH 
current_month AS (
  SELECT DATE_TRUNC('month', CURRENT_DATE) AS start_date,
         DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' AS end_date
),
revenue AS (
  SELECT 
    COALESCE(SUM(i.total_amount::numeric), 0) AS total_revenue,
    COUNT(DISTINCT i.id) AS invoice_count,
    COUNT(DISTINCT i.customer_id) AS active_customers
  FROM invoices i, current_month cm
  WHERE i.organization_id = auth_org_id()
    AND i.issue_date >= cm.start_date
    AND i.issue_date <= cm.end_date
    AND i.status NOT IN ('draft', 'cancelled', 'void')
),
expenses AS (
  SELECT 
    COALESCE(SUM(b.total_amount::numeric), 0) AS total_expenses,
    COUNT(DISTINCT b.id) AS bill_count,
    COUNT(DISTINCT b.vendor_id) AS active_vendors
  FROM bills b, current_month cm
  WHERE b.organization_id = auth_org_id()
    AND b.bill_date >= cm.start_date
    AND b.bill_date <= cm.end_date
    AND b.status NOT IN ('draft', 'cancelled', 'void')
),
receivables AS (
  SELECT 
    COALESCE(SUM(balance_due::numeric), 0) AS total_receivables,
    COALESCE(AVG(CURRENT_DATE - due_date::date), 0) AS avg_days_overdue
  FROM invoices
  WHERE organization_id = auth_org_id()
    AND status IN ('sent', 'viewed', 'partially_paid', 'overdue')
),
payables AS (
  SELECT 
    COALESCE(SUM(balance_due::numeric), 0) AS total_payables,
    COALESCE(AVG(CURRENT_DATE - due_date::date), 0) AS avg_days_overdue
  FROM bills
  WHERE organization_id = auth_org_id()
    AND status IN ('received', 'approved', 'partially_paid', 'overdue')
),
cash_position AS (
  SELECT COALESCE(SUM(current_balance::numeric), 0) AS total_cash
  FROM chart_accounts
  WHERE organization_id = auth_org_id()
    AND type = 'asset'
    AND (code LIKE '1%' OR lower(name) LIKE '%cash%' OR lower(name) LIKE '%bank%')
)
SELECT 
  -- Revenue metrics
  r.total_revenue AS monthly_revenue,
  r.invoice_count AS monthly_invoices,
  r.active_customers,
  
  -- Expense metrics
  e.total_expenses AS monthly_expenses,
  e.bill_count AS monthly_bills,
  e.active_vendors,
  
  -- Profitability
  (r.total_revenue - e.total_expenses) AS monthly_profit,
  CASE 
    WHEN r.total_revenue > 0 
    THEN ROUND(((r.total_revenue - e.total_expenses) / r.total_revenue * 100)::numeric, 2)
    ELSE 0
  END AS profit_margin_percent,
  
  -- Working capital
  rec.total_receivables,
  rec.avg_days_overdue AS ar_days_overdue,
  pay.total_payables,
  pay.avg_days_overdue AS ap_days_overdue,
  
  -- Cash position
  cp.total_cash AS cash_balance,
  
  -- Cash runway (months)
  CASE 
    WHEN e.total_expenses > 0 
    THEN ROUND((cp.total_cash / e.total_expenses)::numeric, 1)
    ELSE NULL
  END AS cash_runway_months
FROM revenue r
CROSS JOIN expenses e
CROSS JOIN receivables rec
CROSS JOIN payables pay
CROSS JOIN cash_position cp;

COMMENT ON VIEW semantic.v_kpi_dashboard IS 'Executive KPI dashboard for AI business health queries';

-- ============================
-- 7. Customer Revenue Analysis
-- ============================
CREATE OR REPLACE VIEW semantic.v_customer_revenue AS
SELECT 
  c.id AS customer_id,
  c.display_name AS customer_name,
  c.email AS customer_email,
  c.type AS customer_type,
  COUNT(DISTINCT i.id) AS total_invoices,
  COALESCE(SUM(i.total_amount::numeric), 0) AS lifetime_revenue,
  COALESCE(AVG(i.total_amount::numeric), 0) AS average_invoice_value,
  MIN(i.issue_date) AS first_invoice_date,
  MAX(i.issue_date) AS last_invoice_date,
  COALESCE(SUM(i.balance_due::numeric), 0) AS outstanding_balance,
  COALESCE(AVG(CASE 
    WHEN i.paid_at IS NOT NULL 
    THEN EXTRACT(DAY FROM i.paid_at - i.due_date)
    ELSE NULL
  END), 0) AS avg_payment_delay_days,
  CASE 
    WHEN MAX(i.issue_date) >= CURRENT_DATE - INTERVAL '30 days' THEN 'active'
    WHEN MAX(i.issue_date) >= CURRENT_DATE - INTERVAL '90 days' THEN 'recent'
    WHEN MAX(i.issue_date) >= CURRENT_DATE - INTERVAL '365 days' THEN 'dormant'
    ELSE 'inactive'
  END AS customer_status
FROM contacts c
LEFT JOIN invoices i ON i.customer_id = c.id
WHERE c.organization_id = auth_org_id()
  AND c.type IN ('customer', 'customer_vendor')
GROUP BY c.id, c.display_name, c.email, c.type;

COMMENT ON VIEW semantic.v_customer_revenue IS 'Customer revenue and payment behavior analysis for AI sales queries';

-- ============================
-- 8. Inventory Status View
-- ============================
CREATE OR REPLACE VIEW semantic.v_inventory_status AS
SELECT 
  p.id AS product_id,
  p.sku,
  p.name AS product_name,
  p.category,
  p.is_service,
  w.id AS warehouse_id,
  w.name AS warehouse_name,
  w.type AS warehouse_type,
  il.quantity_on_hand::numeric AS quantity_on_hand,
  il.quantity_reserved::numeric AS quantity_reserved,
  il.quantity_available::numeric AS quantity_available,
  il.reorder_point::numeric AS reorder_point,
  il.reorder_quantity::numeric AS reorder_quantity,
  il.average_cost::numeric AS average_cost,
  il.total_value::numeric AS total_value,
  CASE 
    WHEN il.quantity_available::numeric <= 0 THEN 'out_of_stock'
    WHEN il.quantity_available::numeric < COALESCE(il.reorder_point::numeric, p.reorder_point::numeric, 0) THEN 'low_stock'
    WHEN il.quantity_available::numeric > COALESCE(il.max_stock_level::numeric, il.reorder_point::numeric * 3, 999999) THEN 'overstock'
    ELSE 'in_stock'
  END AS stock_status,
  il.last_received_date,
  il.last_sold_date,
  il.last_counted_date
FROM products p
JOIN inventory_levels il ON il.product_id = p.id
JOIN warehouses w ON w.id = il.warehouse_id
WHERE p.organization_id = auth_org_id()
  AND p.is_tracked_inventory = true
  AND p.is_active = true
  AND w.is_active = true;

COMMENT ON VIEW semantic.v_inventory_status IS 'Real-time inventory levels and status for AI inventory queries';

-- ============================
-- 9. Order Pipeline View
-- ============================
CREATE OR REPLACE VIEW semantic.v_order_pipeline AS
SELECT 
  'sales' AS order_type,
  so.id AS order_id,
  so.order_number,
  so.order_date,
  c.display_name AS party_name,
  so.total_amount::numeric AS total_amount,
  so.currency_code,
  so.status,
  so.expected_delivery_date AS expected_date,
  (so.total_quantity_ordered::numeric - so.total_quantity_fulfilled::numeric) AS pending_quantity,
  CASE 
    WHEN so.status = 'draft' THEN 1
    WHEN so.status = 'pending' THEN 2
    WHEN so.status = 'confirmed' THEN 3
    WHEN so.status IN ('in_fulfillment', 'partially_fulfilled') THEN 4
    WHEN so.status = 'fulfilled' THEN 5
    ELSE 6
  END AS pipeline_stage
FROM sales_orders so
JOIN contacts c ON c.id = so.customer_id
WHERE so.organization_id = auth_org_id()
  AND so.status NOT IN ('completed', 'cancelled')

UNION ALL

SELECT 
  'purchase' AS order_type,
  po.id AS order_id,
  po.order_number,
  po.order_date,
  v.display_name AS party_name,
  po.total_amount::numeric AS total_amount,
  po.currency_code,
  po.status,
  po.expected_receipt_date AS expected_date,
  (po.total_quantity_ordered::numeric - po.total_quantity_received::numeric) AS pending_quantity,
  CASE 
    WHEN po.status = 'draft' THEN 1
    WHEN po.status = 'pending_approval' THEN 2
    WHEN po.status IN ('approved', 'sent') THEN 3
    WHEN po.status IN ('acknowledged', 'partially_received') THEN 4
    WHEN po.status = 'received' THEN 5
    ELSE 6
  END AS pipeline_stage
FROM purchase_orders po
JOIN contacts v ON v.id = po.vendor_id
WHERE po.organization_id = auth_org_id()
  AND po.status NOT IN ('completed', 'cancelled');

COMMENT ON VIEW semantic.v_order_pipeline IS 'Sales and purchase order pipeline for AI order management queries';

-- ============================
-- 10. Financial Ratios View
-- ============================
CREATE OR REPLACE VIEW semantic.v_financial_ratios AS
WITH 
assets AS (
  SELECT COALESCE(SUM(current_balance::numeric), 0) AS total_assets
  FROM chart_accounts
  WHERE organization_id = auth_org_id()
    AND type IN ('asset')
),
current_assets AS (
  SELECT COALESCE(SUM(current_balance::numeric), 0) AS total_current_assets
  FROM chart_accounts
  WHERE organization_id = auth_org_id()
    AND type = 'asset'
    AND (code LIKE '1%' OR code LIKE '2%') -- Customize based on your COA
),
liabilities AS (
  SELECT COALESCE(SUM(current_balance::numeric), 0) AS total_liabilities
  FROM chart_accounts
  WHERE organization_id = auth_org_id()
    AND type IN ('liability')
),
current_liabilities AS (
  SELECT COALESCE(SUM(current_balance::numeric), 0) AS total_current_liabilities
  FROM chart_accounts
  WHERE organization_id = auth_org_id()
    AND type = 'liability'
    AND code LIKE '2%' -- Customize based on your COA
),
equity AS (
  SELECT COALESCE(SUM(current_balance::numeric), 0) AS total_equity
  FROM chart_accounts
  WHERE organization_id = auth_org_id()
    AND type = 'equity'
),
revenue_ytd AS (
  SELECT COALESCE(SUM(jl.credit::numeric - jl.debit::numeric), 0) AS total_revenue
  FROM journal_lines jl
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  JOIN chart_accounts ca ON ca.id = jl.account_id
  WHERE je.organization_id = auth_org_id()
    AND ca.type = 'income'
    AND je.entry_date >= DATE_TRUNC('year', CURRENT_DATE)
    AND je.status = 'posted'
)
SELECT 
  -- Liquidity Ratios
  CASE 
    WHEN cl.total_current_liabilities > 0 
    THEN ROUND((ca.total_current_assets / cl.total_current_liabilities)::numeric, 2)
    ELSE NULL
  END AS current_ratio,
  
  -- Leverage Ratios
  CASE 
    WHEN e.total_equity > 0 
    THEN ROUND((l.total_liabilities / e.total_equity)::numeric, 2)
    ELSE NULL
  END AS debt_to_equity_ratio,
  
  -- Asset Management
  CASE 
    WHEN a.total_assets > 0 
    THEN ROUND((r.total_revenue / a.total_assets)::numeric, 2)
    ELSE NULL
  END AS asset_turnover_ratio,
  
  -- Working Capital
  (ca.total_current_assets - cl.total_current_liabilities) AS working_capital,
  
  -- Raw values for reference
  a.total_assets,
  ca.total_current_assets,
  l.total_liabilities,
  cl.total_current_liabilities,
  e.total_equity,
  r.total_revenue AS revenue_ytd
FROM assets a
CROSS JOIN current_assets ca
CROSS JOIN liabilities l
CROSS JOIN current_liabilities cl
CROSS JOIN equity e
CROSS JOIN revenue_ytd r;

COMMENT ON VIEW semantic.v_financial_ratios IS 'Key financial ratios for AI financial health assessment';

-- ============================
-- Indexes for Performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_org_status ON bills(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_status ON journal_entries(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_org_type ON chart_accounts(organization_id, type);

-- ============================
-- Grant Permissions
-- ============================
-- Grant permissions to the semantic schema (schema was created in 0002_early_groot.sql)
GRANT USAGE ON SCHEMA semantic TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA semantic TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA semantic GRANT SELECT ON TABLES TO authenticated;