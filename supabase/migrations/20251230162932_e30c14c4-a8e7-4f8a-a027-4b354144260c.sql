-- Create new function for search suggestions (autocomplete) - fixed syntax
CREATE OR REPLACE FUNCTION public.get_search_suggestions(
  query_text text,
  suggestion_limit integer DEFAULT 10
)
RETURNS TABLE(
  suggestion_type text,
  suggestion_text text,
  suggestion_id text,
  category_name text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_query TEXT;
BEGIN
  normalized_query := lower(trim(COALESCE(query_text, '')));
  
  IF length(normalized_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH 
  -- Tags (with category info)
  tag_suggestions AS (
    SELECT 
      'tag'::text as suggestion_type,
      t.name as suggestion_text,
      t.id::text as suggestion_id,
      tc.name as category_name,
      CASE WHEN lower(t.name) LIKE normalized_query || '%' THEN 0 ELSE 1 END as priority,
      length(t.name) as name_len
    FROM tags t
    JOIN tag_categories tc ON t.category_id = tc.id
    WHERE lower(t.name) LIKE '%' || normalized_query || '%'
      AND tc.id IN (1, 2, 3, 4)
    ORDER BY priority, name_len
    LIMIT 4
  ),
  
  -- Institutions
  institution_suggestions AS (
    SELECT 
      'institution'::text as suggestion_type,
      i.name as suggestion_text,
      i.id::text as suggestion_id,
      NULL::text as category_name,
      CASE WHEN lower(i.name) LIKE normalized_query || '%' THEN 0 ELSE 1 END as priority,
      length(i.name) as name_len
    FROM institutions i
    WHERE lower(i.name) LIKE '%' || normalized_query || '%'
    ORDER BY priority, name_len
    LIMIT 3
  ),
  
  -- Program titles
  program_suggestions AS (
    SELECT 
      'program'::text as suggestion_type,
      sp.title as suggestion_text,
      sp.id::text as suggestion_id,
      NULL::text as category_name,
      CASE WHEN lower(sp.title) LIKE normalized_query || '%' THEN 0 ELSE 1 END as priority,
      length(sp.title) as name_len
    FROM support_programs sp
    WHERE lower(sp.title) LIKE '%' || normalized_query || '%'
    ORDER BY priority, 
      CASE WHEN sp.application_deadline IS NULL OR sp.application_deadline >= CURRENT_DATE THEN 0 ELSE 1 END,
      name_len
    LIMIT 3
  )
  
  SELECT suggestion_type, suggestion_text, suggestion_id, category_name
  FROM (
    SELECT suggestion_type, suggestion_text, suggestion_id, category_name, 1 as type_order, priority, name_len FROM tag_suggestions
    UNION ALL
    SELECT suggestion_type, suggestion_text, suggestion_id, category_name, 2 as type_order, priority, name_len FROM institution_suggestions
    UNION ALL
    SELECT suggestion_type, suggestion_text, suggestion_id, category_name, 3 as type_order, priority, name_len FROM program_suggestions
  ) combined
  ORDER BY type_order, priority, name_len
  LIMIT suggestion_limit;
END;
$function$;