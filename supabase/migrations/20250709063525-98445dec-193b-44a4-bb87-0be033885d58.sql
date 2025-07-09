-- Add question_number and answered_by_full_name columns to soru_cevap table
ALTER TABLE public.soru_cevap 
ADD COLUMN question_number SERIAL,
ADD COLUMN answered_by_full_name TEXT;

-- Create index for question_number for better performance
CREATE INDEX idx_soru_cevap_question_number ON public.soru_cevap(question_number);

-- Update existing records to have question numbers based on creation order
UPDATE public.soru_cevap 
SET question_number = sub.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num 
  FROM public.soru_cevap
) sub 
WHERE public.soru_cevap.id = sub.id;