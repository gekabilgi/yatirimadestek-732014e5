-- Drop the existing anonymous insert policy
DROP POLICY IF EXISTS "Anonymous users can insert questions" ON public.soru_cevap;

-- Create a new, more secure insert policy with validation and rate limiting
CREATE POLICY "Anonymous users can insert questions with validation"
ON public.soru_cevap FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Rate limit: prevent spam using existing check_submission_spam function
  NOT check_submission_spam(email, 'qna', 60)
  -- Email must be present and have valid format
  AND email IS NOT NULL 
  AND email LIKE '%@%.%'
  AND LENGTH(email) BETWEEN 5 AND 255
  -- Full name must be present and reasonable length
  AND full_name IS NOT NULL
  AND LENGTH(full_name) BETWEEN 2 AND 100
  -- Question must be present and reasonable length
  AND question IS NOT NULL
  AND LENGTH(question) BETWEEN 10 AND 5000
  -- Province must be present and reasonable length
  AND province IS NOT NULL
  AND LENGTH(province) BETWEEN 2 AND 50
  -- Phone is optional but if present must be reasonable length
  AND (phone IS NULL OR LENGTH(phone) BETWEEN 10 AND 20)
);