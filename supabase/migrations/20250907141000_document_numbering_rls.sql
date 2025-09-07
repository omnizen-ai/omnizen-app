-- Add RLS policies for document numbering tables
-- Critical security fix to prevent cross-organization data access

-- Enable RLS on document sequences table
ALTER TABLE document_number_sequences ENABLE ROW LEVEL SECURITY;

-- Policy for document_number_sequences - users can manage sequences for their org
CREATE POLICY "Users can manage doc sequences for their org" ON document_number_sequences
  FOR ALL TO authenticated 
  USING (organization_id = auth_org_id());

-- Enable RLS on generated numbers table  
ALTER TABLE generated_document_numbers ENABLE ROW LEVEL SECURITY;

-- Policy for generated_document_numbers - users can view generated numbers for their org
CREATE POLICY "Users can view generated numbers for their org" ON generated_document_numbers
  FOR SELECT TO authenticated 
  USING (organization_id = auth_org_id());

-- Policy for inserting generated numbers (needed by functions)
CREATE POLICY "Functions can insert generated numbers for auth org" ON generated_document_numbers
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = auth_org_id());

-- Policy for updating generated numbers (for marking as used)
CREATE POLICY "Users can update generated numbers for their org" ON generated_document_numbers
  FOR UPDATE TO authenticated 
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());