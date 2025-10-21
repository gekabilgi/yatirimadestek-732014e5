-- Enable PostgreSQL extensions for hybrid search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create GIN index for exact text search on variants array
CREATE INDEX IF NOT EXISTS idx_question_variants_variants_gin 
ON public.question_variants 
USING GIN (variants);

-- Create trigram index for fuzzy matching on canonical question
CREATE INDEX IF NOT EXISTS idx_question_variants_canonical_trgm 
ON public.question_variants 
USING GIN (canonical_question gin_trgm_ops);

-- Add full-text search vector column (regular column, not generated)
ALTER TABLE public.question_variants 
ADD COLUMN IF NOT EXISTS fts_vector tsvector;

-- Create function to update fts_vector
CREATE OR REPLACE FUNCTION public.update_question_variants_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts_vector := to_tsvector('turkish', 
    COALESCE(NEW.canonical_question, '') || ' ' || 
    COALESCE(array_to_string(NEW.variants, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically update fts_vector on insert/update
DROP TRIGGER IF EXISTS trigger_update_question_variants_fts ON public.question_variants;
CREATE TRIGGER trigger_update_question_variants_fts
  BEFORE INSERT OR UPDATE ON public.question_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_question_variants_fts();

-- Update existing rows to populate fts_vector
UPDATE public.question_variants
SET fts_vector = to_tsvector('turkish', 
  COALESCE(canonical_question, '') || ' ' || 
  COALESCE(array_to_string(variants, ' '), '')
)
WHERE fts_vector IS NULL;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_question_variants_fts 
ON public.question_variants 
USING GIN (fts_vector);

-- Create hybrid search function with 4-tier matching strategy
CREATE OR REPLACE FUNCTION public.hybrid_match_question_variants(
  query_text TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.04,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  canonical_question TEXT,
  canonical_answer TEXT,
  variants TEXT[],
  similarity FLOAT,
  match_type TEXT,
  source_document TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_query TEXT;
BEGIN
  -- Normalize query (lowercase, trim)
  normalized_query := lower(trim(query_text));

  RETURN QUERY
  WITH 
  -- Tier 1: Exact matches in variants (highest priority)
  exact_matches AS (
    SELECT 
      qv.id,
      qv.canonical_question,
      qv.canonical_answer,
      qv.variants,
      0.99::FLOAT as similarity,
      'exact'::TEXT as match_type,
      qv.source_document,
      qv.metadata
    FROM question_variants qv
    WHERE 
      normalized_query = ANY(
        SELECT lower(unnest(qv.variants))
      )
    LIMIT match_count
  ),
  
  -- Tier 2: Trigram similarity (fuzzy matching)
  fuzzy_matches AS (
    SELECT 
      qv.id,
      qv.canonical_question,
      qv.canonical_answer,
      qv.variants,
      (0.85 * similarity(lower(qv.canonical_question), normalized_query))::FLOAT as similarity,
      'fuzzy'::TEXT as match_type,
      qv.source_document,
      qv.metadata
    FROM question_variants qv
    WHERE 
      NOT EXISTS (SELECT 1 FROM exact_matches em WHERE em.id = qv.id)
      AND (
        similarity(lower(qv.canonical_question), normalized_query) > 0.3
        OR EXISTS (
          SELECT 1 FROM unnest(qv.variants) v
          WHERE similarity(lower(v), normalized_query) > 0.3
        )
      )
    ORDER BY similarity(lower(qv.canonical_question), normalized_query) DESC
    LIMIT match_count
  ),
  
  -- Tier 3: Full-text search (keyword matching)
  fts_matches AS (
    SELECT 
      qv.id,
      qv.canonical_question,
      qv.canonical_answer,
      qv.variants,
      (0.80 * ts_rank(qv.fts_vector, websearch_to_tsquery('turkish', query_text)))::FLOAT as similarity,
      'fts'::TEXT as match_type,
      qv.source_document,
      qv.metadata
    FROM question_variants qv
    WHERE 
      NOT EXISTS (SELECT 1 FROM exact_matches em WHERE em.id = qv.id)
      AND NOT EXISTS (SELECT 1 FROM fuzzy_matches fm WHERE fm.id = qv.id)
      AND qv.fts_vector @@ websearch_to_tsquery('turkish', query_text)
    ORDER BY ts_rank(qv.fts_vector, websearch_to_tsquery('turkish', query_text)) DESC
    LIMIT match_count
  ),
  
  -- Tier 4: Semantic embedding search (current method)
  semantic_matches AS (
    SELECT
      qv.id,
      qv.canonical_question,
      qv.canonical_answer,
      qv.variants,
      (1 - (qv.embedding <=> query_embedding))::FLOAT AS similarity,
      'semantic'::TEXT as match_type,
      qv.source_document,
      qv.metadata
    FROM question_variants qv
    WHERE 
      NOT EXISTS (SELECT 1 FROM exact_matches em WHERE em.id = qv.id)
      AND NOT EXISTS (SELECT 1 FROM fuzzy_matches fm WHERE fm.id = qv.id)
      AND NOT EXISTS (SELECT 1 FROM fts_matches ft WHERE ft.id = qv.id)
      AND 1 - (qv.embedding <=> query_embedding) > match_threshold
    ORDER BY qv.embedding <=> query_embedding
    LIMIT match_count
  )
  
  -- Combine all results, prioritizing by match type
  SELECT * FROM exact_matches
  UNION ALL
  SELECT * FROM fuzzy_matches
  UNION ALL
  SELECT * FROM fts_matches
  UNION ALL
  SELECT * FROM semantic_matches
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;