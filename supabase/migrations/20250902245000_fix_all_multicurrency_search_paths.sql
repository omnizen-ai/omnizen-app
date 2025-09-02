-- ============================
-- Fix Search Path Security Issues for Multi-Currency Functions
-- ============================
-- Set explicit search paths to prevent role mutable search path vulnerabilities
-- Following the same pattern as existing migrations: SET search_path = ''

-- ============================
-- 1. Fix get_exchange_rate function
-- ============================
CREATE OR REPLACE FUNCTION public.get_exchange_rate(
  p_from_currency text,
  p_to_currency text,
  p_organization_id uuid,
  p_date date DEFAULT CURRENT_DATE
) 
RETURNS numeric 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rate numeric;
BEGIN
  -- If same currency, return 1
  IF p_from_currency = p_to_currency THEN
    RETURN 1;
  END IF;
  
  -- Get the most recent exchange rate
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE organization_id = p_organization_id
    AND from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND rate_date::date <= p_date
  ORDER BY rate_date DESC
  LIMIT 1;
  
  -- If no rate found, try reverse rate
  IF v_rate IS NULL THEN
    SELECT 1.0 / rate INTO v_rate
    FROM public.exchange_rates
    WHERE organization_id = p_organization_id
      AND from_currency = p_to_currency
      AND to_currency = p_from_currency
      AND rate_date::date <= p_date
    ORDER BY rate_date DESC
    LIMIT 1;
  END IF;
  
  -- Return rate or 1 if not found
  RETURN COALESCE(v_rate, 1);
END;
$$;

-- ============================
-- 2. Fix update_journal_entry_totals_multicurrency function
-- ============================
CREATE OR REPLACE FUNCTION public.update_journal_entry_totals_multicurrency()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update the journal entry totals with multi-currency support
  UPDATE public.journal_entries je
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
      FROM public.journal_lines jl
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
      FROM public.journal_lines jl
      WHERE jl.journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
    )
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  RETURN NEW;
END;
$$;

-- ============================
-- 3. Fix the existing functions that were showing warnings
-- ============================

-- Fix enforce_journal_balance_on_post (if it exists)
CREATE OR REPLACE FUNCTION public.enforce_journal_balance_on_post()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_mode text;
  v_enforce_on_post boolean;
BEGIN
  -- Only check when status changes to 'posted'
  IF NEW.status = 'posted' AND (OLD.status IS NULL OR OLD.status != 'posted') THEN
    -- Get organization settings
    SELECT o.accounting_mode, o.enforce_balance_on_post
    INTO v_org_mode, v_enforce_on_post
    FROM public.organizations o
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
$$;

-- Fix validate_journal_balance (ensure it has search_path set)
CREATE OR REPLACE FUNCTION public.validate_journal_balance(
  p_journal_entry_id uuid,
  p_enforce_mode text DEFAULT 'warning'
) 
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
  v_total_debits numeric;
  v_total_credits numeric;
  v_difference numeric;
  v_status text;
  v_org_mode text;
  v_is_balanced boolean;
BEGIN
  -- Get the organization's accounting mode
  SELECT o.accounting_mode INTO v_org_mode
  FROM public.journal_entries je
  JOIN public.organizations o ON o.id = je.organization_id
  WHERE je.id = p_journal_entry_id;

  -- Get the totals
  SELECT total_debits, total_credits, is_balanced
  INTO v_total_debits, v_total_credits, v_is_balanced
  FROM public.journal_entries
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
$$;

-- Fix update_journal_entry_totals (ensure it has search_path set)
CREATE OR REPLACE FUNCTION public.update_journal_entry_totals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update the journal entry totals
  UPDATE public.journal_entries
  SET 
    total_debits = (
      SELECT COALESCE(SUM(debit), 0)
      FROM public.journal_lines
      WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
    ),
    total_credits = (
      SELECT COALESCE(SUM(credit), 0)
      FROM public.journal_lines
      WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
    )
  WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  
  RETURN NEW;
END;
$$;

-- ============================
-- Migration Complete
-- ============================
-- All functions now have SET search_path = '' following the established pattern
-- This prevents search_path hijacking security vulnerabilities