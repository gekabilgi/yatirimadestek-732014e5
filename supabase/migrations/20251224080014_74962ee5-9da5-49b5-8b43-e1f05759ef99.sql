-- First drop the existing get_public_qna function with old signature
DROP FUNCTION IF EXISTS public.get_public_qna(integer);

-- Then recreate with correct signature and search_path
CREATE FUNCTION public.get_public_qna(limit_count integer DEFAULT 100)
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
SET search_path = public
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
  LIMIT limit_count;
$$;