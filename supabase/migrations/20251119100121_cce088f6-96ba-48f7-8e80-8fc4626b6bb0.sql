-- Allow anonymous users to submit questions
CREATE POLICY "Anonymous users can insert questions"
ON public.soru_cevap
FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL 
  AND question IS NOT NULL 
  AND province IS NOT NULL
  AND full_name IS NOT NULL
);