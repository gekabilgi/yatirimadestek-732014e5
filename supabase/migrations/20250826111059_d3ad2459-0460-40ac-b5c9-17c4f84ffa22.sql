-- Fix the Security Definer View issue by ensuring the view is created with SECURITY INVOKER
-- (which is the default, but we'll be explicit for security)
DROP VIEW IF EXISTS public.public_qna_view;

-- Create a secure view with explicit SECURITY INVOKER to use the permissions of the querying user
CREATE VIEW public.public_qna_view 
WITH (security_invoker = true) AS
SELECT 
  id,
  question,
  answer,
  category,
  province,
  created_at,
  answer_date,
  question_number
FROM public.soru_cevap 
WHERE 
  answered = true 
  AND answer IS NOT NULL 
  AND answer_status = 'approved'
  -- Only show questions that have been explicitly approved for public viewing
  AND approved_by_admin_id IS NOT NULL
  -- Additional security: exclude any questions that might contain email patterns
  AND question !~* '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
  AND (answer IS NULL OR answer !~* '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b');

-- Add security comment
COMMENT ON VIEW public.public_qna_view IS 'Secure public view for displaying approved questions and answers. Uses SECURITY INVOKER to respect caller permissions.';

-- Grant appropriate permissions
GRANT SELECT ON public.public_qna_view TO anon;
GRANT SELECT ON public.public_qna_view TO authenticated;