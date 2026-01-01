-- Fix the remaining match_custom_rag_chunks overload that has different argument order
-- This version has: query_embedding, p_store_id, match_threshold, match_count

-- First drop the old function with different argument order
DROP FUNCTION IF EXISTS public.match_custom_rag_chunks(vector, uuid, double precision, integer);

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION public.match_custom_rag_chunks(
  query_embedding vector,
  p_store_id uuid,
  match_threshold double precision DEFAULT 0.3,
  match_count integer DEFAULT 30
)
RETURNS TABLE(
  id uuid, 
  document_id uuid, 
  document_name text, 
  content text, 
  chunk_index integer, 
  similarity double precision
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.document_id,
    d.display_name as document_name,
    c.content,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.custom_rag_chunks c
  JOIN public.custom_rag_documents d ON d.id = c.document_id
  WHERE c.store_id = p_store_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;