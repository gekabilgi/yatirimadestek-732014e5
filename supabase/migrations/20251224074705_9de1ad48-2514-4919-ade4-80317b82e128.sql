-- Drop existing view first to recreate with correct columns
DROP VIEW IF EXISTS public.public_qna_view;

-- Create the secure public view that excludes personal data
CREATE VIEW public.public_qna_view AS
SELECT 
  id,
  question,
  answer,
  answer_date,
  category,
  province,
  answered,
  answer_status,
  created_at,
  question_number
FROM public.soru_cevap
WHERE answered = true AND answer_status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.public_qna_view TO anon, authenticated;