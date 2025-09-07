-- Fix the critical enum mismatch issue
-- The existing 'document_type' enum is for file types, not business document types
-- We need a separate enum for document numbering

-- Create a new enum specifically for document numbering
CREATE TYPE document_numbering_type AS ENUM (
  'invoice',
  'bill', 
  'payment',
  'journal_entry',
  'sales_order',
  'purchase_order',
  'quotation',
  'fulfillment',
  'receipt',
  'stock_move',
  'adjustment',
  'bank_transaction',
  'forecast'
);

-- Drop the existing tables and recreate with correct enum
DROP TABLE IF EXISTS generated_document_numbers CASCADE;
DROP TABLE IF EXISTS document_number_sequences CASCADE;

-- Recreate document_number_sequences table with correct enum
CREATE TABLE document_number_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type document_numbering_type NOT NULL,
  current_number integer NOT NULL DEFAULT 0,
  prefix text NOT NULL DEFAULT '',
  suffix text NOT NULL DEFAULT '',
  padding integer NOT NULL DEFAULT 3,
  include_year boolean NOT NULL DEFAULT true,
  include_period boolean NOT NULL DEFAULT false,
  reset_frequency reset_frequency NOT NULL DEFAULT 'yearly',
  last_reset_at timestamp without time zone,
  sample_format text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  allow_manual_override boolean NOT NULL DEFAULT true,
  custom_format text,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

-- Recreate generated_document_numbers table with correct enum
CREATE TABLE generated_document_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES document_number_sequences(id) ON DELETE CASCADE,
  document_type document_numbering_type NOT NULL,
  generated_number text NOT NULL,
  sequence_number integer NOT NULL,
  document_id uuid,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamp without time zone,
  generated_for text,
  user_id uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

-- Recreate indexes
CREATE UNIQUE INDEX core_doc_seq_org_type_idx ON document_number_sequences (organization_id, document_type);
CREATE INDEX core_doc_seq_active_idx ON document_number_sequences (is_active);
CREATE INDEX core_doc_seq_type_idx ON document_number_sequences (document_type);

CREATE UNIQUE INDEX core_gen_doc_org_number_idx ON generated_document_numbers (organization_id, generated_number);
CREATE INDEX core_gen_doc_sequence_idx ON generated_document_numbers (sequence_id);
CREATE INDEX core_gen_doc_document_idx ON generated_document_numbers (document_id);
CREATE INDEX core_gen_doc_used_idx ON generated_document_numbers (is_used);
CREATE INDEX core_gen_doc_type_idx ON generated_document_numbers (document_type);

-- Recreate RLS policies
ALTER TABLE document_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_document_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage doc sequences for their org" ON document_number_sequences
  FOR ALL TO authenticated 
  USING (organization_id = auth_org_id());

CREATE POLICY "Users can view generated numbers for their org" ON generated_document_numbers
  FOR SELECT TO authenticated 
  USING (organization_id = auth_org_id());

CREATE POLICY "Functions can insert generated numbers for auth org" ON generated_document_numbers
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = auth_org_id());

CREATE POLICY "Users can update generated numbers for their org" ON generated_document_numbers
  FOR UPDATE TO authenticated 
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

-- Update database functions to use correct enum type
DROP FUNCTION IF EXISTS generate_next_document_number(uuid, text, uuid);

CREATE OR REPLACE FUNCTION generate_next_document_number(
  p_organization_id UUID,
  p_document_type TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  sequence_record RECORD;
  next_number INTEGER;
  generated_number TEXT;
  needs_reset BOOLEAN;
BEGIN
  -- Get or create sequence record with row locking
  SELECT *
  INTO sequence_record
  FROM document_number_sequences
  WHERE organization_id = p_organization_id 
    AND document_type = p_document_type::document_numbering_type
    AND is_active = TRUE
  FOR UPDATE;
  
  -- Create default sequence if none exists
  IF sequence_record IS NULL THEN
    INSERT INTO document_number_sequences (
      organization_id,
      document_type,
      current_number,
      prefix,
      suffix,
      padding,
      include_year,
      include_period,
      reset_frequency,
      sample_format,
      description
    ) VALUES (
      p_organization_id,
      p_document_type::document_numbering_type,
      0,
      CASE p_document_type
        WHEN 'invoice' THEN 'INV-'
        WHEN 'bill' THEN 'BILL-'
        WHEN 'quotation' THEN 'QUOTE-'
        WHEN 'sales_order' THEN 'SO-'
        WHEN 'purchase_order' THEN 'PO-'
        WHEN 'payment' THEN 'PAY-'
        WHEN 'journal_entry' THEN 'JE-'
        WHEN 'fulfillment' THEN 'FULF-'
        WHEN 'receipt' THEN 'REC-'
        WHEN 'stock_move' THEN 'SM-'
        WHEN 'adjustment' THEN 'ADJ-'
        WHEN 'bank_transaction' THEN 'BT-'
        WHEN 'forecast' THEN 'FC-'
        ELSE 'DOC-'
      END,
      '',
      3,
      TRUE,
      FALSE,
      'yearly',
      CASE p_document_type
        WHEN 'invoice' THEN 'INV--YYYY-###'
        WHEN 'bill' THEN 'BILL--YYYY-###'
        WHEN 'quotation' THEN 'QUOTE--YYYY-###'
        WHEN 'sales_order' THEN 'SO--YYYY-###'
        WHEN 'purchase_order' THEN 'PO--YYYY-###'
        WHEN 'payment' THEN 'PAY--YYYY-###'
        WHEN 'journal_entry' THEN 'JE--YYYY-###'
        WHEN 'fulfillment' THEN 'FULF--YYYY-###'
        WHEN 'receipt' THEN 'REC--YYYY-###'
        WHEN 'stock_move' THEN 'SM--YYYY-###'
        WHEN 'adjustment' THEN 'ADJ--YYYY-###'
        WHEN 'bank_transaction' THEN 'BT--YYYY-###'
        WHEN 'forecast' THEN 'FC--YYYY-###'
        ELSE 'DOC--YYYY-###'
      END,
      'Auto-generated sequence for ' || p_document_type
    )
    RETURNING * INTO sequence_record;
  END IF;
  
  -- Check if sequence needs reset
  needs_reset := should_reset_sequence(
    sequence_record.reset_frequency,
    sequence_record.last_reset_at
  );
  
  -- Reset sequence if needed
  IF needs_reset THEN
    UPDATE document_number_sequences 
    SET current_number = 0, 
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE id = sequence_record.id;
    sequence_record.current_number := 0;
  END IF;
  
  -- Increment sequence number
  next_number := sequence_record.current_number + 1;
  
  -- Update sequence record
  UPDATE document_number_sequences 
  SET current_number = next_number,
      updated_at = NOW()
  WHERE id = sequence_record.id;
  
  -- Build formatted number
  generated_number := build_document_number(
    sequence_record.prefix,
    sequence_record.suffix,
    next_number,
    sequence_record.padding,
    sequence_record.include_year,
    sequence_record.include_period,
    sequence_record.custom_format
  );
  
  -- Record the generated number
  INSERT INTO generated_document_numbers (
    organization_id,
    sequence_id,
    document_type,
    generated_number,
    sequence_number,
    user_id,
    generated_for
  ) VALUES (
    p_organization_id,
    sequence_record.id,
    p_document_type::document_numbering_type,
    generated_number,
    next_number,
    p_user_id,
    'auto_generation'
  );
  
  RETURN generated_number;
END;
$$ LANGUAGE plpgsql;