-- Drop existing function first (required to change return type)
DROP FUNCTION IF EXISTS public.match_support_programs(vector, double precision, integer);

-- Recreate with correct timestamp type
CREATE OR REPLACE FUNCTION public.match_support_programs(query_embedding vector, match_threshold double precision DEFAULT 0.4, match_count integer DEFAULT 5)
 RETURNS TABLE(id uuid, title text, description text, eligibility_criteria text, contact_info text, application_deadline timestamp without time zone, institution_id integer, similarity double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;