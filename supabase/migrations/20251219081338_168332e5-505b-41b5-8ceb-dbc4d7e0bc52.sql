-- Update hybrid_match_question_variants function with improved weights and multi-query support
CREATE OR REPLACE FUNCTION public.hybrid_match_question_variants(
  query_text text, 
  query_embedding vector, 
  match_threshold double precision DEFAULT 0.04, 
  match_count integer DEFAULT 10,
  expanded_queries text[] DEFAULT NULL
)
RETURNS TABLE(
  id uuid, 
  canonical_question text, 
  canonical_answer text, 
  variants text[], 
  similarity double precision, 
  match_type text, 
  source_document text, 
  metadata jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_query TEXT;
  all_queries TEXT[];
BEGIN
  -- Normalize query (lowercase, trim)
  normalized_query := lower(trim(query_text));
  
  -- Build array of all queries (original + expanded)
  IF expanded_queries IS NOT NULL AND array_length(expanded_queries, 1) > 0 THEN
    all_queries := ARRAY[normalized_query] || expanded_queries;
  ELSE
    all_queries := ARRAY[normalized_query];
  END IF;

  RETURN QUERY
  WITH 
  -- Tier 1: Exact matches in variants (highest priority) - check all queries
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
    WHERE EXISTS (
      SELECT 1 FROM unnest(all_queries) q
      WHERE lower(q) = ANY(
        SELECT lower(unnest(qv.variants))
      )
    )
    OR normalized_query = lower(qv.canonical_question)
    LIMIT match_count
  ),
  
  -- Tier 2: Trigram similarity (fuzzy matching) - improved weight 0.90
  fuzzy_matches AS (
    SELECT 
      qv.id,
      qv.canonical_question,
      qv.canonical_answer,
      qv.variants,
      (0.90 * GREATEST(
        similarity(lower(qv.canonical_question), normalized_query),
        COALESCE((
          SELECT MAX(similarity(lower(v), normalized_query))
          FROM unnest(qv.variants) v
        ), 0)
      ))::FLOAT as similarity,
      'fuzzy'::TEXT as match_type,
      qv.source_document,
      qv.metadata
    FROM question_variants qv
    WHERE 
      NOT EXISTS (SELECT 1 FROM exact_matches em WHERE em.id = qv.id)
      AND (
        similarity(lower(qv.canonical_question), normalized_query) > 0.25
        OR EXISTS (
          SELECT 1 FROM unnest(qv.variants) v
          WHERE similarity(lower(v), normalized_query) > 0.25
        )
        -- Also check expanded queries
        OR EXISTS (
          SELECT 1 FROM unnest(all_queries) q
          WHERE similarity(lower(qv.canonical_question), lower(q)) > 0.25
        )
      )
    ORDER BY similarity(lower(qv.canonical_question), normalized_query) DESC
    LIMIT match_count
  ),
  
  -- Tier 3: Full-text search (keyword matching) - improved weight 0.85
  fts_matches AS (
    SELECT 
      qv.id,
      qv.canonical_question,
      qv.canonical_answer,
      qv.variants,
      (0.85 * ts_rank(qv.fts_vector, websearch_to_tsquery('turkish', query_text)))::FLOAT as similarity,
      'fts'::TEXT as match_type,
      qv.source_document,
      qv.metadata
    FROM question_variants qv
    WHERE 
      NOT EXISTS (SELECT 1 FROM exact_matches em WHERE em.id = qv.id)
      AND NOT EXISTS (SELECT 1 FROM fuzzy_matches fm WHERE fm.id = qv.id)
      AND (
        qv.fts_vector @@ websearch_to_tsquery('turkish', query_text)
        -- Also try expanded queries for FTS
        OR EXISTS (
          SELECT 1 FROM unnest(all_queries) q
          WHERE qv.fts_vector @@ websearch_to_tsquery('turkish', q)
        )
      )
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
$function$;