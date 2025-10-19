-- Cevaplanmış soruların herkese açık olmasını sağlayan politika
CREATE POLICY "Public can view answered questions"
ON public.soru_cevap
FOR SELECT
TO public
USING (
  answer_status = 'answered' 
  AND answer IS NOT NULL 
  AND answer != ''
);