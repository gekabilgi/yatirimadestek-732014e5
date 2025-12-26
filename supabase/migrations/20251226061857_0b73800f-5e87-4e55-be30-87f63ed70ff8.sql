-- Fix Security Definer View warnings by recreating views with SECURITY INVOKER

-- Fix vertex_configs_public view
DROP VIEW IF EXISTS public.vertex_configs_public;
CREATE VIEW public.vertex_configs_public 
WITH (security_invoker = true)
AS
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

-- Grant read access
GRANT SELECT ON public.vertex_configs_public TO anon;
GRANT SELECT ON public.vertex_configs_public TO authenticated;
GRANT SELECT ON public.vertex_configs_public TO service_role;

-- Fix public_qna_view
DROP VIEW IF EXISTS public.public_qna_view CASCADE;
CREATE VIEW public.public_qna_view 
WITH (security_invoker = true)
AS
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

-- Grant read access
GRANT SELECT ON public.public_qna_view TO anon;
GRANT SELECT ON public.public_qna_view TO authenticated;