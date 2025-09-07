-- Fix timestamp mismatch in should_reset_sequence function
-- The function signature needs to match the table column type

-- Drop and recreate function with correct timestamp type
DROP FUNCTION IF EXISTS should_reset_sequence(TEXT, TIMESTAMP WITH TIME ZONE);

-- Function to check if a sequence needs to be reset based on frequency
CREATE OR REPLACE FUNCTION should_reset_sequence(
  reset_frequency TEXT,
  last_reset_at TIMESTAMP WITHOUT TIME ZONE  -- Changed to match table schema
) RETURNS BOOLEAN AS $$
DECLARE
  current_time TIMESTAMP WITHOUT TIME ZONE := NOW();  -- Also changed to without timezone
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