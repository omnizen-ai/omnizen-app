-- Custom migration for MCP server functions
-- These functions are required by the database-mcp-supabase edge function

-- Function to get tables in a schema with metadata
CREATE OR REPLACE FUNCTION public.get_tables(schema_name text DEFAULT 'public')
RETURNS TABLE (
  table_name text,
  table_type text,
  row_count bigint,
  columns jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    t.table_type::text,
    COALESCE((
      SELECT reltuples::bigint 
      FROM pg_class 
      WHERE oid = (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass
    ), 0) as row_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'column_name', c.column_name,
          'data_type', c.data_type,
          'is_nullable', c.is_nullable,
          'column_default', c.column_default
        ) ORDER BY c.ordinal_position
      ) FILTER (WHERE c.column_name IS NOT NULL), 
      '[]'::jsonb
    ) as columns
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
  WHERE t.table_schema = schema_name
    AND t.table_type IN ('BASE TABLE', 'VIEW')
  GROUP BY t.table_name, t.table_type, t.table_schema;
END;
$$;

-- Grant execute permission to authenticated and service role
GRANT EXECUTE ON FUNCTION public.get_tables TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tables TO service_role;

-- Function to get detailed schema information for a specific table
CREATE OR REPLACE FUNCTION public.get_table_schema(table_name_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'table_name', t.table_name,
    'columns', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'column_name', c.column_name,
          'data_type', c.data_type,
          'is_nullable', c.is_nullable,
          'column_default', c.column_default,
          'is_primary_key', CASE 
            WHEN pk.column_name IS NOT NULL THEN true 
            ELSE false 
          END
        ) ORDER BY c.ordinal_position
      ), 
      '[]'::jsonb
    )
  ) INTO result
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
  LEFT JOIN (
    SELECT kcu.column_name, kcu.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
  ) pk ON pk.table_name = t.table_name AND pk.column_name = c.column_name
  WHERE t.table_schema = 'public'
    AND t.table_name = table_name_param
  GROUP BY t.table_name;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_table_schema TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_schema TO service_role;