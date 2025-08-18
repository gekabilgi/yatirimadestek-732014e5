-- SECURITY FIX: Explicitly set SECURITY INVOKER on views to resolve linter warning
-- The linter requires explicit security mode declaration to avoid security definer risks

-- Fix public_qna_view
DROP VIEW IF EXISTS public.public_qna_view;
CREATE VIEW public.public_qna_view AS
SELECT 
  id,
  question,
  answer,
  province,
  created_at,
  answer_date,
  category,
  question_number
FROM public.soru_cevap
WHERE 
  answered = true 
  AND answer IS NOT NULL 
  AND answer_status = 'approved'
  AND answer != '';

-- Explicitly set security invoker mode
ALTER VIEW public.public_qna_view SET (security_invoker = true);

-- Fix approved_pre_requests view  
ALTER VIEW public.approved_pre_requests SET (security_invoker = true);

-- Maintain public access grants
GRANT SELECT ON public.public_qna_view TO public;
GRANT SELECT ON public.public_qna_view TO anon;