-- Update hybrid_search_support_programs to filter old closed programs and sort by created_at DESC
CREATE OR REPLACE FUNCTION public.hybrid_search_support_programs(query_text text DEFAULT NULL::text, p_institution_id integer DEFAULT NULL::integer, p_tag_ids integer[] DEFAULT NULL::integer[], p_status text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, description text, eligibility_criteria text, contact_info text, application_deadline timestamp without time zone, institution_id integer, created_at timestamp with time zone, updated_at timestamp with time zone, score double precision, match_type text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  normalized_query TEXT;
  has_search_query BOOLEAN;
  search_keywords TEXT[];
  keyword_count INTEGER;
BEGIN
  normalized_query := lower(trim(COALESCE(query_text, '')));
  has_search_query := length(normalized_query) >= 2;
  
  -- Split query into individual keywords
  IF has_search_query THEN
    search_keywords := string_to_array(normalized_query, ' ');
    search_keywords := array_remove(search_keywords, '');
    keyword_count := array_length(search_keywords, 1);
  ELSE
    keyword_count := 0;
  END IF;

  RETURN QUERY
  WITH 
  -- Aggregate all tag names for each program
  tag_aggregated AS (
    SELECT 
      spt.support_program_id,
      string_agg(LOWER(t.name), ' ') as all_tags
    FROM support_program_tags spt
    JOIN tags t ON spt.tag_id = t.id
    GROUP BY spt.support_program_id
  ),
  
  base_programs AS (
    SELECT 
      sp.id,
      sp.title,
      sp.description,
      sp.eligibility_criteria,
      sp.contact_info,
      sp.application_deadline,
      sp.institution_id,
      i.name as institution_name,
      COALESCE(ta.all_tags, '') as all_tags,
      sp.created_at,
      sp.updated_at,
      sp.fts_vector
    FROM support_programs sp
    LEFT JOIN institutions i ON sp.institution_id = i.id
    LEFT JOIN tag_aggregated ta ON sp.id = ta.support_program_id
    WHERE 
      -- Institution filter
      (p_institution_id IS NULL OR sp.institution_id = p_institution_id)
      -- Status filter
      AND (
        p_status IS NULL OR p_status = ''
        OR (p_status = 'open' AND (sp.application_deadline IS NULL OR sp.application_deadline >= CURRENT_DATE))
        OR (p_status = 'closed' AND sp.application_deadline < CURRENT_DATE)
      )
      -- Tag filter
      AND (
        p_tag_ids IS NULL 
        OR array_length(p_tag_ids, 1) IS NULL
        OR EXISTS (
          SELECT 1 FROM support_program_tags spt
          WHERE spt.support_program_id = sp.id AND spt.tag_id = ANY(p_tag_ids)
        )
      )
      -- NEW: Exclude programs closed more than 1 year ago
      AND (
        sp.application_deadline IS NULL 
        OR sp.application_deadline >= CURRENT_DATE - INTERVAL '1 year'
      )
  ),
  
  scored_programs AS (
    SELECT 
      bp.*,
      CASE
        -- No search: base score
        WHEN NOT has_search_query THEN 0.5
        
        -- Tier 1: Exact full query match in title
        WHEN lower(bp.title) LIKE '%' || normalized_query || '%' THEN 0.99
        
        -- Tier 2: Exact full query match in institution name
        WHEN lower(COALESCE(bp.institution_name, '')) LIKE '%' || normalized_query || '%' THEN 0.95
        
        -- Tier 2.5: Exact full query match in tag names
        WHEN bp.all_tags LIKE '%' || normalized_query || '%' THEN 0.93
        
        -- Tier 3: All keywords found in title, institution, description, or tags
        WHEN keyword_count > 0 AND (
          SELECT count(*) FROM unnest(search_keywords) kw
          WHERE lower(bp.title) LIKE '%' || kw || '%'
             OR lower(COALESCE(bp.institution_name, '')) LIKE '%' || kw || '%'
             OR lower(COALESCE(bp.description, '')) LIKE '%' || kw || '%'
             OR bp.all_tags LIKE '%' || kw || '%'
        ) = keyword_count THEN 0.90
        
        -- Tier 4: Some keywords found - score proportionally
        WHEN keyword_count > 0 AND (
          SELECT count(*) FROM unnest(search_keywords) kw
          WHERE lower(bp.title) LIKE '%' || kw || '%'
             OR lower(COALESCE(bp.institution_name, '')) LIKE '%' || kw || '%'
             OR lower(COALESCE(bp.description, '')) LIKE '%' || kw || '%'
             OR bp.all_tags LIKE '%' || kw || '%'
        ) > 0 THEN 
          0.60 + (0.25 * (
            SELECT count(*)::real / keyword_count::real
            FROM unnest(search_keywords) kw
            WHERE lower(bp.title) LIKE '%' || kw || '%'
               OR lower(COALESCE(bp.institution_name, '')) LIKE '%' || kw || '%'
               OR lower(COALESCE(bp.description, '')) LIKE '%' || kw || '%'
               OR bp.all_tags LIKE '%' || kw || '%'
          ))
        
        -- Tier 5: FTS with OR logic (any keyword matches)
        WHEN has_search_query AND bp.fts_vector @@ plainto_tsquery('turkish', query_text) THEN 0.50
        
        -- Tier 6: Trigram fuzzy match on title
        WHEN has_search_query AND similarity(lower(bp.title), normalized_query) > 0.2 THEN 
          0.30 + (similarity(lower(bp.title), normalized_query) * 0.15)
        
        -- Tier 7: Trigram fuzzy match on institution name
        WHEN has_search_query AND similarity(lower(COALESCE(bp.institution_name, '')), normalized_query) > 0.2 THEN 
          0.25 + (similarity(lower(COALESCE(bp.institution_name, '')), normalized_query) * 0.10)
        
        ELSE 0
      END as calc_score,
      CASE
        WHEN NOT has_search_query THEN 'filter'
        WHEN lower(bp.title) LIKE '%' || normalized_query || '%' THEN 'exact_title'
        WHEN lower(COALESCE(bp.institution_name, '')) LIKE '%' || normalized_query || '%' THEN 'exact_institution'
        WHEN bp.all_tags LIKE '%' || normalized_query || '%' THEN 'exact_tag'
        WHEN keyword_count > 0 AND (SELECT count(*) FROM unnest(search_keywords) kw WHERE lower(bp.title) LIKE '%' || kw || '%' OR lower(COALESCE(bp.institution_name, '')) LIKE '%' || kw || '%' OR lower(COALESCE(bp.description, '')) LIKE '%' || kw || '%' OR bp.all_tags LIKE '%' || kw || '%') = keyword_count THEN 'all_keywords'
        WHEN keyword_count > 0 AND (SELECT count(*) FROM unnest(search_keywords) kw WHERE lower(bp.title) LIKE '%' || kw || '%' OR lower(COALESCE(bp.institution_name, '')) LIKE '%' || kw || '%' OR lower(COALESCE(bp.description, '')) LIKE '%' || kw || '%' OR bp.all_tags LIKE '%' || kw || '%') > 0 THEN 'partial_keywords'
        WHEN has_search_query AND bp.fts_vector @@ plainto_tsquery('turkish', query_text) THEN 'fts'
        WHEN has_search_query AND similarity(lower(bp.title), normalized_query) > 0.2 THEN 'fuzzy_title'
        WHEN has_search_query AND similarity(lower(COALESCE(bp.institution_name, '')), normalized_query) > 0.2 THEN 'fuzzy_institution'
        ELSE 'no_match'
      END as calc_match_type
    FROM base_programs bp
  )
  
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
    sp.calc_score as score,
    sp.calc_match_type as match_type
  FROM scored_programs sp
  WHERE sp.calc_score > 0
  ORDER BY 
    -- 1. Open programs first (0), closed programs after (1)
    CASE WHEN sp.application_deadline IS NULL OR sp.application_deadline >= CURRENT_DATE THEN 0 ELSE 1 END,
    -- 2. If searching, prioritize by score; otherwise skip
    CASE WHEN has_search_query THEN sp.calc_score ELSE 0 END DESC,
    -- 3. Sort by created_at newest first
    sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;