-- Document Number Generation Functions
-- Provides atomic, concurrent-safe document number generation with customizable patterns

-- Function to format a number with zero padding
CREATE OR REPLACE FUNCTION format_sequence_number(
  num INTEGER,
  padding INTEGER DEFAULT 3
) RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(num::TEXT, padding, '0');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to build the document number based on pattern configuration
CREATE OR REPLACE FUNCTION build_document_number(
  prefix TEXT,
  suffix TEXT,
  sequence_num INTEGER,
  padding INTEGER,
  include_year BOOLEAN,
  include_period BOOLEAN,
  custom_format TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  current_period TEXT := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  formatted_sequence TEXT := format_sequence_number(sequence_num, padding);
BEGIN
  -- Use custom format if provided (advanced use case)
  IF custom_format IS NOT NULL THEN
    -- Replace placeholders in custom format
    result := custom_format;
    result := REPLACE(result, '{YEAR}', current_year);
    result := REPLACE(result, '{PERIOD}', current_period);
    result := REPLACE(result, '{SEQ}', formatted_sequence);
    result := REPLACE(result, '{PREFIX}', COALESCE(prefix, ''));
    result := REPLACE(result, '{SUFFIX}', COALESCE(suffix, ''));
    RETURN result;
  END IF;

  -- Build standard format: PREFIX[-YEAR][-PERIOD]-SEQUENCE[SUFFIX]
  result := COALESCE(prefix, '');
  
  IF include_year THEN
    result := result || CASE WHEN result = '' THEN '' ELSE '-' END || current_year;
  END IF;
  
  IF include_period THEN
    result := result || CASE WHEN result = '' THEN '' ELSE '-' END || current_period;
  END IF;
  
  -- Add separator before sequence if we have any prefix content
  IF result != '' THEN
    result := result || '-';
  END IF;
  
  result := result || formatted_sequence;
  
  -- Add suffix if provided
  IF suffix IS NOT NULL AND suffix != '' THEN
    result := result || suffix;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a sequence needs to be reset based on frequency
CREATE OR REPLACE FUNCTION should_reset_sequence(
  reset_frequency TEXT,
  last_reset_at TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Never reset
  IF reset_frequency = 'never' THEN
    RETURN FALSE;
  END IF;
  
  -- First time - no reset needed
  IF last_reset_at IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check based on frequency
  CASE reset_frequency
    WHEN 'yearly' THEN
      RETURN EXTRACT(YEAR FROM current_time) > EXTRACT(YEAR FROM last_reset_at);
    WHEN 'monthly' THEN
      RETURN (
        EXTRACT(YEAR FROM current_time) > EXTRACT(YEAR FROM last_reset_at) OR
        (EXTRACT(YEAR FROM current_time) = EXTRACT(YEAR FROM last_reset_at) AND 
         EXTRACT(MONTH FROM current_time) > EXTRACT(MONTH FROM last_reset_at))
      );
    WHEN 'quarterly' THEN
      RETURN (
        EXTRACT(YEAR FROM current_time) > EXTRACT(YEAR FROM last_reset_at) OR
        (EXTRACT(YEAR FROM current_time) = EXTRACT(YEAR FROM last_reset_at) AND 
         EXTRACT(QUARTER FROM current_time) > EXTRACT(QUARTER FROM last_reset_at))
      );
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to generate next document number atomically
-- This function is thread-safe and handles concurrent requests
CREATE OR REPLACE FUNCTION generate_next_document_number(
  p_organization_id UUID,
  p_document_type TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  sequence_record RECORD;
  next_number INTEGER;
  generated_number TEXT;
  sequence_id UUID;
  needs_reset BOOLEAN;
BEGIN
  -- Get or create sequence configuration with row-level locking
  SELECT * INTO sequence_record
  FROM document_number_sequences
  WHERE organization_id = p_organization_id 
    AND document_type = p_document_type::document_type
    AND is_active = TRUE
  FOR UPDATE;
  
  -- If no sequence exists, create default one
  IF NOT FOUND THEN
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
      is_active,
      allow_manual_override
    ) VALUES (
      p_organization_id,
      p_document_type::document_type,
      0,
      UPPER(LEFT(p_document_type, 3)) || '-', -- Default prefix like "INV-", "BIL-"
      '',
      3,
      TRUE,
      FALSE,
      'yearly',
      UPPER(LEFT(p_document_type, 3)) || '-2024-{###}',
      TRUE,
      TRUE
    ) RETURNING * INTO sequence_record;
  END IF;
  
  sequence_id := sequence_record.id;
  
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
    WHERE id = sequence_id;
    
    sequence_record.current_number := 0;
  END IF;
  
  -- Increment the sequence number
  next_number := sequence_record.current_number + 1;
  
  -- Build the document number
  generated_number := build_document_number(
    sequence_record.prefix,
    sequence_record.suffix,
    next_number,
    sequence_record.padding,
    sequence_record.include_year,
    sequence_record.include_period,
    sequence_record.custom_format
  );
  
  -- Update the sequence
  UPDATE document_number_sequences
  SET current_number = next_number,
      updated_at = NOW()
  WHERE id = sequence_id;
  
  -- Record the generated number for audit
  INSERT INTO generated_document_numbers (
    organization_id,
    sequence_id,
    document_type,
    generated_number,
    sequence_number,
    is_used,
    generated_for,
    user_id
  ) VALUES (
    p_organization_id,
    sequence_id,
    p_document_type::document_type,
    generated_number,
    next_number,
    FALSE, -- Will be marked as used when document is created
    'api',
    p_user_id
  );
  
  RETURN generated_number;
END;
$$ LANGUAGE plpgsql;

-- Function to mark a generated number as used
CREATE OR REPLACE FUNCTION mark_document_number_used(
  p_organization_id UUID,
  p_generated_number TEXT,
  p_document_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE generated_document_numbers
  SET is_used = TRUE,
      used_at = NOW(),
      document_id = p_document_id
  WHERE organization_id = p_organization_id
    AND generated_number = p_generated_number
    AND is_used = FALSE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get next document number preview (without consuming it)
CREATE OR REPLACE FUNCTION preview_next_document_number(
  p_organization_id UUID,
  p_document_type TEXT
) RETURNS TEXT AS $$
DECLARE
  sequence_record RECORD;
  next_number INTEGER;
  generated_number TEXT;
BEGIN
  -- Get sequence configuration (no locking since it's just preview)
  SELECT * INTO sequence_record
  FROM document_number_sequences
  WHERE organization_id = p_organization_id 
    AND document_type = p_document_type::document_type
    AND is_active = TRUE;
  
  -- If no sequence exists, return default format
  IF NOT FOUND THEN
    RETURN UPPER(LEFT(p_document_type, 3)) || '-' || EXTRACT(YEAR FROM NOW()) || '-001';
  END IF;
  
  -- Calculate what the next number would be
  next_number := sequence_record.current_number + 1;
  
  -- Check if sequence would need reset
  IF should_reset_sequence(sequence_record.reset_frequency, sequence_record.last_reset_at) THEN
    next_number := 1;
  END IF;
  
  -- Build the document number
  generated_number := build_document_number(
    sequence_record.prefix,
    sequence_record.suffix,
    next_number,
    sequence_record.padding,
    sequence_record.include_year,
    sequence_record.include_period,
    sequence_record.custom_format
  );
  
  RETURN generated_number;
END;
$$ LANGUAGE plpgsql;