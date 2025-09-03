-- Enable pgvector extension for vector embeddings and similarity search
-- This enables vector data types and vector similarity operations
-- Install in public schema for compatibility with Drizzle ORM

-- Enable the vector extension in the public schema
-- This makes vector types immediately available to Drizzle migrations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create dedicated vectors schema for organization (optional, for future vector-specific functions)
CREATE SCHEMA IF NOT EXISTS vectors;

-- Grant usage permissions
GRANT USAGE ON SCHEMA vectors TO authenticated;
GRANT USAGE ON SCHEMA vectors TO anon;

-- Verify extension is installed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension failed to install';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON EXTENSION vector IS 'Vector data type and ivfflat/hnsw access methods for similarity search and RAG operations';