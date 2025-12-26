-- =====================================
-- FIX ALL SECURITY ISSUES
-- =====================================

-- =====================
-- ERROR 1: vertex_configs - Remove public read access for API keys
-- =====================

-- Drop the dangerous public read policies
DROP POLICY IF EXISTS "Allow public read access" ON vertex_configs;
DROP POLICY IF EXISTS "Public can read vertex configs" ON vertex_configs;

-- Create a secure view for non-sensitive config data that edge functions can use
DROP VIEW IF EXISTS public.vertex_configs_public;
CREATE VIEW public.vertex_configs_public AS
SELECT 
  id,
  model_name,
  system_instruction,
  rag_corpus,
  similarity_top_k,
  temperature,
  top_p,
  max_output_tokens,
  config_key,
  staging_bucket,
  vector_distance_threshold,
  created_at,
  updated_at
FROM vertex_configs;

-- Grant read access to authenticated users and service role for the non-sensitive view
GRANT SELECT ON public.vertex_configs_public TO anon;
GRANT SELECT ON public.vertex_configs_public TO authenticated;
GRANT SELECT ON public.vertex_configs_public TO service_role;

-- =====================
-- ERROR 2: soru_cevap - Create secure view for public answers without exposing PII
-- =====================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Public can view approved answers safely" ON soru_cevap;

-- Drop and recreate the secure public view that only shows approved Q&A without PII
DROP VIEW IF EXISTS public.public_qna_view CASCADE;
CREATE VIEW public.public_qna_view AS
SELECT 
  id,
  category,
  question,
  answer,
  province,
  answer_date,
  created_at,
  question_number
FROM soru_cevap
WHERE answered = true AND answer_status = 'approved';

-- Grant public read access to the safe view
GRANT SELECT ON public.public_qna_view TO anon;
GRANT SELECT ON public.public_qna_view TO authenticated;

-- Create secure RLS policy for soru_cevap main table
-- Direct table access: only own questions or admin/ydo access
CREATE POLICY "Public can view approved answers via view only" 
ON soru_cevap 
FOR SELECT 
TO public
USING (
  -- Admins can see everything
  is_admin(auth.uid())
  -- Authenticated users can see their own questions
  OR (auth.uid() IS NOT NULL AND (auth.jwt() ->> 'email') = email)
);

-- =====================
-- WARN: Function Search Path Mutable - Fix 3 functions
-- =====================

-- Fix match_custom_rag_chunks
CREATE OR REPLACE FUNCTION public.match_custom_rag_chunks(
  p_store_id uuid,
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5
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

-- Fix match_document_chunks
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5
)
RETURNS TABLE(
  id integer, 
  content text, 
  metadata jsonb, 
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
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- Fix match_knowledge
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5
)
RETURNS TABLE(
  id uuid, 
  question text, 
  answer text, 
  similarity double precision
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $function$
  SELECT
    k.id,
    k.question,
    k.answer,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM public.cb_knowledge_base k
  WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
$function$;

-- =====================
-- INFO: Verify user_metadata RLS is secure (already has proper policies)
-- =====================

-- Add comment documenting security review
COMMENT ON TABLE public.user_metadata IS 'User metadata including province and department. RLS ensures users can only see their own data. two_factor_enabled and last_password_change are protected by user-only access policy.';