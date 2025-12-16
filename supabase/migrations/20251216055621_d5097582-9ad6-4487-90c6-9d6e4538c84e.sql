-- Add embedding column to support_programs table
ALTER TABLE support_programs 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW index for similarity search
CREATE INDEX IF NOT EXISTS idx_support_programs_embedding 
ON support_programs USING hnsw (embedding vector_cosine_ops);

-- Create function to match support programs by embedding similarity
CREATE OR REPLACE FUNCTION match_support_programs(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  eligibility_criteria text,
  contact_info text,
  application_deadline timestamp with time zone,
  institution_id integer,
  similarity float
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.title,
    sp.description,
    sp.eligibility_criteria,
    sp.contact_info,
    sp.application_deadline,
    sp.institution_id,
    (1 - (sp.embedding <=> query_embedding))::float AS similarity
  FROM support_programs sp
  WHERE sp.embedding IS NOT NULL
    AND 1 - (sp.embedding <=> query_embedding) > match_threshold
  ORDER BY sp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;