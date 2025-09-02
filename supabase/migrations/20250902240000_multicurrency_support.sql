-- ============================
-- Multi-Currency Support Enhancement
-- ============================
-- Adds views and functions for multi-currency accounting
-- Works with the foreign_debit/foreign_credit fields added by Drizzle migration

-- ============================
-- 1. Function to get current exchange rate
-- ============================
CREATE OR REPLACE FUNCTION get_exchange_rate(
  p_from_currency text,
  p_to_currency text,
  p_organization_id uuid,
  p_date date DEFAULT CURRENT_DATE
) RETURNS numeric AS $$
DECLARE
  v_rate numeric;
BEGIN
  -- If same currency, return 1
  IF p_from_currency = p_to_currency THEN
    RETURN 1;
  END IF;
  
  -- Get the most recent exchange rate
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE organization_id = p_organization_id
    AND from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND effective_date <= p_date
  ORDER BY effective_date DESC
  LIMIT 1;
  
  -- If no rate found, try reverse rate
  IF v_rate IS NULL THEN
    SELECT 1.0 / rate INTO v_rate
    FROM exchange_rates
    WHERE organization_id = p_organization_id
      AND from_currency = p_to_currency
      AND to_currency = p_from_currency
      AND effective_date <= p_date
    ORDER BY effective_date DESC
    LIMIT 1;
  END IF;
  
  -- Return rate or 1 if not found
  RETURN COALESCE(v_rate, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================
-- 2. Update journal entry totals trigger for multi-currency
-- ============================
CREATE OR REPLACE FUNCTION update_journal_entry_totals_multicurrency()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the journal entry totals
  -- If foreign amounts exist, use them with exchange rate
  -- Otherwise use base currency amounts
  UPDATE journal_entries je
  SET 
    total_debits = (
      SELECT COALESCE(SUM(
        CASE 
          WHEN jl.foreign_debit IS NOT NULL AND jl.exchange_rate IS NOT NULL THEN
            jl.foreign_debit * jl.exchange_rate
          ELSE 
            jl.debit
        END
      ), 0)
      FROM journal_lines jl
      WHERE jl.journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
    ),
    total_credits = (
      SELECT COALESCE(SUM(
        CASE 
          WHEN jl.foreign_credit IS NOT NULL AND jl.exchange_rate IS NOT NULL THEN
            jl.foreign_credit * jl.exchange_rate
          ELSE 
            jl.credit
        END
      ), 0)
      FROM journal_lines jl
      WHERE jl.journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
    )
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers and recreate
DROP TRIGGER IF EXISTS trg_update_journal_totals_insert_update ON journal_lines;
DROP TRIGGER IF EXISTS trg_update_journal_totals_delete ON journal_lines;

CREATE TRIGGER trg_update_journal_totals_insert_update
AFTER INSERT OR UPDATE ON journal_lines
FOR EACH ROW
EXECUTE FUNCTION update_journal_entry_totals_multicurrency();

CREATE TRIGGER trg_update_journal_totals_delete
AFTER DELETE ON journal_lines
FOR EACH ROW
EXECUTE FUNCTION update_journal_entry_totals_multicurrency();

-- ============================
-- 3. Multi-Currency Account Balances View
-- ============================
CREATE OR REPLACE VIEW semantic.v_multicurrency_balances AS
WITH account_balances AS (
  SELECT 
    ca.id AS account_id,
    ca.organization_id,
    ca.code AS account_code,
    ca.name AS account_name,
    ca.type AS account_type,
    ca.currency_code AS account_currency,
    o.base_currency,
    
    -- Balance in account's natural currency
    SUM(
      CASE 
        WHEN jl.currency_code = ca.currency_code THEN
          jl.debit - jl.credit
        ELSE 0
      END
    ) AS balance_account_currency,
    
    -- Balance in base currency (using historical rates)
    SUM(
      CASE 
        WHEN jl.foreign_debit IS NOT NULL OR jl.foreign_credit IS NOT NULL THEN
          -- Use foreign amounts with exchange rate
          (COALESCE(jl.foreign_debit, 0) - COALESCE(jl.foreign_credit, 0)) * COALESCE(jl.exchange_rate, 1)
        ELSE
          -- Use base currency amounts
          jl.debit - jl.credit
      END
    ) AS balance_base_currency
    
  FROM chart_accounts ca
  JOIN organizations o ON o.id = ca.organization_id
  LEFT JOIN journal_lines jl ON jl.account_id = ca.id
  LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id 
    AND je.status = 'posted'
  WHERE ca.organization_id = auth_org_id()
  GROUP BY ca.id, ca.organization_id, ca.code, ca.name, ca.type, ca.currency_code, o.base_currency
)
SELECT 
  *,
  -- Calculate unrealized FX gain/loss for foreign currency accounts
  CASE 
    WHEN account_currency != base_currency AND balance_account_currency != 0 THEN
      balance_account_currency * get_exchange_rate(account_currency, base_currency, organization_id, CURRENT_DATE) - balance_base_currency
    ELSE 0
  END AS unrealized_fx_gain_loss
FROM account_balances;

COMMENT ON VIEW semantic.v_multicurrency_balances IS 'Account balances with multi-currency support and unrealized FX gains/losses';

-- ============================
-- 4. Foreign Currency Transactions View
-- ============================
CREATE OR REPLACE VIEW semantic.v_foreign_currency_transactions AS
SELECT 
  je.id AS journal_entry_id,
  je.organization_id,
  je.entry_number,
  je.entry_date,
  je.description,
  jl.id AS line_id,
  jl.line_number,
  ca.code AS account_code,
  ca.name AS account_name,
  jl.currency_code,
  o.base_currency,
  jl.exchange_rate,
  
  -- Foreign currency amounts
  jl.foreign_debit,
  jl.foreign_credit,
  
  -- Base currency amounts
  jl.debit AS base_debit,
  jl.credit AS base_credit,
  
  -- Exchange rate used vs current rate
  get_exchange_rate(jl.currency_code, o.base_currency, je.organization_id, CURRENT_DATE) AS current_rate,
  
  -- Unrealized gain/loss per line
  CASE 
    WHEN jl.foreign_debit IS NOT NULL THEN
      jl.foreign_debit * (get_exchange_rate(jl.currency_code, o.base_currency, je.organization_id, CURRENT_DATE) - COALESCE(jl.exchange_rate, 1))
    WHEN jl.foreign_credit IS NOT NULL THEN
      jl.foreign_credit * (COALESCE(jl.exchange_rate, 1) - get_exchange_rate(jl.currency_code, o.base_currency, je.organization_id, CURRENT_DATE))
    ELSE 0
  END AS unrealized_fx_change
  
FROM journal_entries je
JOIN journal_lines jl ON jl.journal_entry_id = je.id
JOIN chart_accounts ca ON ca.id = jl.account_id
JOIN organizations o ON o.id = je.organization_id
WHERE je.organization_id = auth_org_id()
  AND je.status = 'posted'
  AND (jl.foreign_debit IS NOT NULL OR jl.foreign_credit IS NOT NULL)
ORDER BY je.entry_date DESC, je.entry_number, jl.line_number;

COMMENT ON VIEW semantic.v_foreign_currency_transactions IS 'All foreign currency transactions with exchange rate tracking';

-- ============================
-- 5. Currency Exposure Summary View
-- ============================
CREATE OR REPLACE VIEW semantic.v_currency_exposure AS
SELECT 
  o.id AS organization_id,
  o.base_currency,
  jl.currency_code AS exposure_currency,
  
  -- Total exposure by currency
  COUNT(DISTINCT je.id) AS transaction_count,
  
  -- Assets in foreign currency
  SUM(CASE 
    WHEN ca.type = 'asset' THEN 
      COALESCE(jl.foreign_debit, jl.debit) - COALESCE(jl.foreign_credit, jl.credit)
    ELSE 0 
  END) AS asset_exposure,
  
  -- Liabilities in foreign currency
  SUM(CASE 
    WHEN ca.type = 'liability' THEN 
      COALESCE(jl.foreign_credit, jl.credit) - COALESCE(jl.foreign_debit, jl.debit)
    ELSE 0 
  END) AS liability_exposure,
  
  -- Net exposure
  SUM(
    CASE 
      WHEN ca.type IN ('asset', 'expense') THEN 
        COALESCE(jl.foreign_debit, jl.debit) - COALESCE(jl.foreign_credit, jl.credit)
      WHEN ca.type IN ('liability', 'income', 'equity') THEN 
        COALESCE(jl.foreign_credit, jl.credit) - COALESCE(jl.foreign_debit, jl.debit)
      ELSE 0
    END
  ) AS net_exposure,
  
  -- Current exchange rate
  get_exchange_rate(jl.currency_code, o.base_currency, o.id, CURRENT_DATE) AS current_exchange_rate,
  
  -- Last transaction date
  MAX(je.entry_date) AS last_transaction_date
  
FROM organizations o
JOIN journal_entries je ON je.organization_id = o.id
JOIN journal_lines jl ON jl.journal_entry_id = je.id
JOIN chart_accounts ca ON ca.id = jl.account_id
WHERE o.id = auth_org_id()
  AND je.status = 'posted'
  AND jl.currency_code != o.base_currency
GROUP BY o.id, o.base_currency, jl.currency_code;

COMMENT ON VIEW semantic.v_currency_exposure IS 'Summary of foreign currency exposure by currency';

-- ============================
-- 6. Grant Permissions
-- ============================
GRANT EXECUTE ON FUNCTION get_exchange_rate TO authenticated;
GRANT EXECUTE ON FUNCTION update_journal_entry_totals_multicurrency TO authenticated;
GRANT SELECT ON semantic.v_multicurrency_balances TO authenticated;
GRANT SELECT ON semantic.v_foreign_currency_transactions TO authenticated;
GRANT SELECT ON semantic.v_currency_exposure TO authenticated;

-- ============================
-- Migration Complete
-- ============================
-- This migration adds comprehensive multi-currency support:
-- 1. Exchange rate lookup function
-- 2. Updated triggers for multi-currency journal totals
-- 3. Views for tracking foreign currency transactions
-- 4. Unrealized FX gain/loss calculations
-- 5. Currency exposure analysis