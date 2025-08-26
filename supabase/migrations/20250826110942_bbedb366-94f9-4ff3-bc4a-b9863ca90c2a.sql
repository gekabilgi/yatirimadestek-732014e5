-- Enable Row Level Security on the public_qna_view
ALTER TABLE public.public_qna_view ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows public read access to the sanitized view
-- This view should only contain approved questions with no personal data
CREATE POLICY "Public can view sanitized QnA data" 
ON public.public_qna_view 
FOR SELECT 
USING (true);

-- Add a comment to document the security consideration
COMMENT ON TABLE public.public_qna_view IS 'Public view for displaying approved questions and answers. Personal information should be excluded at the view definition level.';

-- Ensure the view only shows approved questions by recreating it with proper filtering
DROP VIEW IF EXISTS public.public_qna_view;

CREATE VIEW public.public_qna_view AS
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
  AND approved_by_admin_id IS NOT NULL;

-- Grant SELECT permission to anon and authenticated users
GRANT SELECT ON public.public_qna_view TO anon;
GRANT SELECT ON public.public_qna_view TO authenticated;