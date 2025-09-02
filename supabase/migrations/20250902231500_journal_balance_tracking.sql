-- ============================
-- Journal Balance Tracking System
-- ============================
-- Implements hybrid approach for flexible balance enforcement
-- Database tracks the state, application enforces the rules

-- ============================
-- 1. Add Generated Column for Balance Status
-- ============================
-- This computed column shows if an entry is balanced
ALTER TABLE journal_entries 
ADD COLUMN is_balanced boolean 
GENERATED ALWAYS AS (total_debits = total_credits) STORED;

-- Add index for quick filtering of unbalanced entries
CREATE INDEX idx_journal_entries_balanced ON journal_entries(is_balanced) 
WHERE is_balanced = false;

-- ============================
-- 2. Add CHECK Constraint for Journal Lines
-- ============================
-- Ensure each line has either debit OR credit, not both (and not neither)
ALTER TABLE journal_lines 
ADD CONSTRAINT chk_journal_lines_debit_credit 
CHECK (
  (debit > 0 AND credit = 0) OR 
  (debit = 0 AND credit > 0) OR 
  (debit = 0 AND credit = 0) -- Allow zero lines for adjustments
);

-- ============================
-- 3. Function to Update Journal Entry Totals
-- ============================
-- This function calculates and updates total debits/credits
CREATE OR REPLACE FUNCTION update_journal_entry_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the journal entry totals
  UPDATE journal_entries
  SET 
    total_debits = (
      SELECT COALESCE(SUM(debit), 0)
      FROM journal_lines
      WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
    ),
    total_credits = (
      SELECT COALESCE(SUM(credit), 0)
      FROM journal_lines
      WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
    )
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 4. Triggers to Maintain Balance Totals
-- ============================
-- Trigger for INSERT/UPDATE/DELETE on journal_lines
CREATE TRIGGER trg_update_journal_totals_insert_update
AFTER INSERT OR UPDATE ON journal_lines
FOR EACH ROW
EXECUTE FUNCTION update_journal_entry_totals();

CREATE TRIGGER trg_update_journal_totals_delete
AFTER DELETE ON journal_lines
FOR EACH ROW
EXECUTE FUNCTION update_journal_entry_totals();

-- ============================
-- 5. Function for Soft Balance Validation (Warning Only)
-- ============================
-- This function can be called to check balance without enforcing
CREATE OR REPLACE FUNCTION validate_journal_balance(
  p_journal_entry_id uuid,
  p_enforce_mode text DEFAULT 'warning'
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_total_debits numeric;
  v_total_credits numeric;
  v_difference numeric;
  v_status text;
  v_org_mode text;
BEGIN
  -- Get the organization's accounting mode
  SELECT o.accounting_mode INTO v_org_mode
  FROM journal_entries je
  JOIN organizations o ON o.id = je.organization_id
  WHERE je.id = p_journal_entry_id;

  -- Get the totals
  SELECT total_debits, total_credits, is_balanced
  INTO v_total_debits, v_total_credits
  FROM journal_entries
  WHERE id = p_journal_entry_id;

  v_difference := v_total_debits - v_total_credits;

  -- Determine validation status based on mode
  IF v_difference = 0 THEN
    v_status := 'balanced';
  ELSIF v_org_mode = 'simple' THEN
    v_status := 'warning';
  ELSIF v_org_mode = 'standard' THEN
    v_status := 'draft_allowed';
  ELSE -- strict mode
    v_status := 'error';
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'journal_entry_id', p_journal_entry_id,
    'total_debits', v_total_debits,
    'total_credits', v_total_credits,
    'difference', v_difference,
    'is_balanced', (v_difference = 0),
    'status', v_status,
    'organization_mode', v_org_mode,
    'message', CASE
      WHEN v_difference = 0 THEN 'Entry is balanced'
      WHEN v_difference > 0 THEN format('Entry has excess debits of %s', v_difference)
      ELSE format('Entry has excess credits of %s', abs(v_difference))
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 6. Optional Strict Validation Function
-- ============================
-- This can be called before posting to enforce balance
CREATE OR REPLACE FUNCTION enforce_journal_balance_on_post()
RETURNS TRIGGER AS $$
DECLARE
  v_org_mode text;
  v_enforce_on_post boolean;
BEGIN
  -- Only check when status changes to 'posted'
  IF NEW.status = 'posted' AND (OLD.status IS NULL OR OLD.status != 'posted') THEN
    -- Get organization settings
    SELECT o.accounting_mode, o.enforce_balance_on_post
    INTO v_org_mode, v_enforce_on_post
    FROM organizations o
    WHERE o.id = NEW.organization_id;

    -- Check if balance should be enforced
    IF (v_org_mode = 'strict' OR (v_org_mode = 'standard' AND v_enforce_on_post)) THEN
      IF NEW.total_debits != NEW.total_credits THEN
        RAISE EXCEPTION 'Cannot post unbalanced journal entry. Debits: %, Credits: %', 
          NEW.total_debits, NEW.total_credits
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for posting validation (disabled by default)
-- Uncomment to enable strict posting validation
-- CREATE TRIGGER trg_enforce_balance_on_post
-- BEFORE UPDATE ON journal_entries
-- FOR EACH ROW
-- EXECUTE FUNCTION enforce_journal_balance_on_post();

-- ============================
-- 7. Helper View for Unbalanced Entries
-- ============================
CREATE OR REPLACE VIEW semantic.v_unbalanced_journal_entries AS
SELECT 
  je.id,
  je.organization_id,
  je.entry_number,
  je.entry_date,
  je.description,
  je.status,
  je.total_debits,
  je.total_credits,
  je.total_debits - je.total_credits AS difference,
  je.is_balanced,
  o.accounting_mode,
  CASE 
    WHEN o.accounting_mode = 'simple' THEN 'Warning Only'
    WHEN o.accounting_mode = 'standard' AND je.status = 'draft' THEN 'Allowed in Draft'
    WHEN o.accounting_mode = 'standard' AND je.status != 'draft' THEN 'Must Balance'
    WHEN o.accounting_mode = 'strict' THEN 'Must Balance'
  END AS enforcement_level
FROM journal_entries je
JOIN organizations o ON o.id = je.organization_id
WHERE je.is_balanced = false
  AND je.organization_id = auth_org_id();

COMMENT ON VIEW semantic.v_unbalanced_journal_entries IS 
'Monitor unbalanced journal entries with enforcement context';

-- ============================
-- 8. Indexes for Performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_status_balanced 
ON journal_entries(organization_id, status, is_balanced);

CREATE INDEX IF NOT EXISTS idx_organizations_accounting_mode 
ON organizations(accounting_mode);

-- ============================
-- 9. Grant Permissions
-- ============================
GRANT EXECUTE ON FUNCTION validate_journal_balance TO authenticated;
GRANT EXECUTE ON FUNCTION update_journal_entry_totals TO authenticated;
GRANT SELECT ON semantic.v_unbalanced_journal_entries TO authenticated;

-- ============================
-- Migration Complete
-- ============================
-- This migration implements a flexible balance tracking system:
-- 1. Database tracks balance state (total_debits, total_credits, is_balanced)
-- 2. Application enforces rules based on organization.accounting_mode
-- 3. Triggers maintain accurate totals automatically
-- 4. Validation functions provide feedback without hard enforcement
-- 5. Organizations can progressively adopt stricter accounting