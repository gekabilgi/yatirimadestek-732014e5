-- Update match_documents function to use 1536 dimensions for OpenAI embeddings
-- This completes the migration from 768 (Gemini) to 1536 (OpenAI) dimensions

-- Drop old index if it exists (from initial 768-dimension setup)
DROP INDEX IF EXISTS public.idx_knowledge_base_embedding;

-- Drop and recreate the match_documents function with correct dimensions
DROP FUNCTION IF EXISTS public.match_documents(vector, double precision, integer);

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1536), -- Updated from 768 to 1536 for OpenAI embeddings
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  filename text,
  content text,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.filename,
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.match_documents IS 'Performs similarity search on knowledge base using OpenAI 1536-dimensional embeddings. Returns documents ordered by cosine similarity.';