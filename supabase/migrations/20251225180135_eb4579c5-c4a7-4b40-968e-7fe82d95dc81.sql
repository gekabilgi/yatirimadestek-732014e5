-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add FTS vector column to support_programs
ALTER TABLE support_programs 
ADD COLUMN IF NOT EXISTS fts_vector tsvector;

-- Create GIN index for FTS
CREATE INDEX IF NOT EXISTS idx_support_programs_fts 
ON support_programs USING gin(fts_vector);

-- Create trigram indexes for fuzzy search on title and description
CREATE INDEX IF NOT EXISTS idx_support_programs_title_trgm 
ON support_programs USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_support_programs_description_trgm 
ON support_programs USING gin(description gin_trgm_ops);

-- Create function to update FTS vector
CREATE OR REPLACE FUNCTION update_support_programs_fts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.fts_vector := to_tsvector('turkish', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.eligibility_criteria, '') || ' ' ||
    COALESCE(NEW.contact_info, '')
  );
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-update FTS vector
DROP TRIGGER IF EXISTS update_support_programs_fts_trigger ON support_programs;
CREATE TRIGGER update_support_programs_fts_trigger
BEFORE INSERT OR UPDATE ON support_programs
FOR EACH ROW
EXECUTE FUNCTION update_support_programs_fts();

-- Populate FTS vector for existing rows
UPDATE support_programs SET fts_vector = to_tsvector('turkish', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' ||
  COALESCE(eligibility_criteria, '') || ' ' ||
  COALESCE(contact_info, '')
);

-- Create hybrid search function
CREATE OR REPLACE FUNCTION hybrid_search_support_programs(
  query_text text DEFAULT NULL,
  p_institution_id integer DEFAULT NULL,
  p_tag_ids integer[] DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  eligibility_criteria text,
  contact_info text,
  application_deadline timestamp without time zone,
  institution_id integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  score float,
  match_type text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_query TEXT;
  has_search_query BOOLEAN;
BEGIN
  normalized_query := lower(trim(COALESCE(query_text, '')));
  has_search_query := length(normalized_query) >= 2;

  RETURN QUERY
  WITH base_programs AS (
    SELECT 
      sp.id,
      sp.title,
      sp.description,
      sp.eligibility_criteria,
      sp.contact_info,
      sp.application_deadline,
      sp.institution_id,
      sp.created_at,
      sp.updated_at,
      sp.fts_vector,
      sp.embedding
    FROM support_programs sp
    WHERE 
      -- Institution filter
      (p_institution_id IS NULL OR sp.institution_id = p_institution_id)
      -- Status filter (open/closed based on application_deadline)
      AND (
        p_status IS NULL 
        OR (p_status = 'open' AND (sp.application_deadline IS NULL OR sp.application_deadline >= CURRENT_DATE))
        OR (p_status = 'closed' AND sp.application_deadline < CURRENT_DATE)
      )
      -- Tag filter
      AND (
        p_tag_ids IS NULL 
        OR array_length(p_tag_ids, 1) IS NULL
        OR EXISTS (
          SELECT 1 FROM support_program_tags spt
          WHERE spt.support_program_id = sp.id
          AND spt.tag_id = ANY(p_tag_ids)
        )
      )
  ),
  
  -- Tier 1: Exact match in title (highest priority)
  exact_matches AS (
    SELECT 
      bp.*,
      0.99::FLOAT as score,
      'exact'::TEXT as match_type
    FROM base_programs bp
    WHERE has_search_query AND lower(bp.title) LIKE '%' || normalized_query || '%'
  ),
  
  -- Tier 2: Full-text search
  fts_matches AS (
    SELECT 
      bp.*,
      (0.85 * ts_rank(bp.fts_vector, websearch_to_tsquery('turkish', query_text)))::FLOAT as score,
      'fts'::TEXT as match_type
    FROM base_programs bp
    WHERE has_search_query
      AND NOT EXISTS (SELECT 1 FROM exact_matches em WHERE em.id = bp.id)
      AND bp.fts_vector @@ websearch_to_tsquery('turkish', query_text)
  ),
  
  -- Tier 3: Trigram fuzzy match
  fuzzy_matches AS (
    SELECT 
      bp.*,
      (0.75 * GREATEST(
        similarity(lower(bp.title), normalized_query),
        similarity(lower(COALESCE(bp.description, '')), normalized_query) * 0.8
      ))::FLOAT as score,
      'fuzzy'::TEXT as match_type
    FROM base_programs bp
    WHERE has_search_query
      AND NOT EXISTS (SELECT 1 FROM exact_matches em WHERE em.id = bp.id)
      AND NOT EXISTS (SELECT 1 FROM fts_matches fm WHERE fm.id = bp.id)
      AND (
        similarity(lower(bp.title), normalized_query) > 0.2
        OR similarity(lower(COALESCE(bp.description, '')), normalized_query) > 0.25
      )
  ),
  
  -- No search query: return all matching filters sorted by date
  no_query_results AS (
    SELECT 
      bp.*,
      CASE 
        WHEN bp.application_deadline IS NULL OR bp.application_deadline >= CURRENT_DATE 
        THEN 1.0::FLOAT
        ELSE 0.5::FLOAT
      END as score,
      'filter'::TEXT as match_type
    FROM base_programs bp
    WHERE NOT has_search_query
  ),
  
  -- Combine all results
  combined AS (
    SELECT * FROM exact_matches
    UNION ALL
    SELECT * FROM fts_matches
    UNION ALL
    SELECT * FROM fuzzy_matches
    UNION ALL
    SELECT * FROM no_query_results
  )
  
  SELECT 
    c.id,
    c.title,
    c.description,
    c.eligibility_criteria,
    c.contact_info,
    c.application_deadline,
    c.institution_id,
    c.created_at,
    c.updated_at,
    c.score,
    c.match_type
  FROM combined c
  ORDER BY 
    -- Open programs first
    CASE WHEN c.application_deadline IS NULL OR c.application_deadline >= CURRENT_DATE THEN 0 ELSE 1 END,
    c.score DESC,
    c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;