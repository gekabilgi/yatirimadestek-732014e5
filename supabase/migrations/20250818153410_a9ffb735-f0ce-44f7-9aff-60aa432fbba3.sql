-- SECURITY FIX: Recreate view with explicit SECURITY INVOKER to resolve linter warning
-- This ensures the view uses the querying user's permissions rather than the view creator's

DROP VIEW IF EXISTS public.public_qna_view;

CREATE VIEW public.public_qna_view 
WITH (security_invoker = true) AS
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

-- Maintain public access grants for the secure view
GRANT SELECT ON public.public_qna_view TO public;
GRANT SELECT ON public.public_qna_view TO anon;