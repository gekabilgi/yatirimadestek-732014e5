-- Update get_public_qna function to support pagination with offset
CREATE OR REPLACE FUNCTION public.get_public_qna(
  limit_count integer DEFAULT 10,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, 
  question text, 
  answer text, 
  answer_date timestamp with time zone, 
  category text, 
  province text, 
  created_at timestamp with time zone, 
  question_number integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    question,
    answer,
    answer_date,
    category,
    province,
    created_at,
    question_number
  FROM public.soru_cevap
  WHERE answered = true AND answer_status = 'approved'
  ORDER BY answer_date DESC NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
$$;