-- Create a function to check newsletter subscription rate limit
-- Prevents spam by limiting signups from the same email within 24 hours
CREATE OR REPLACE FUNCTION public.check_newsletter_rate_limit(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Check if this email has subscribed in the last 24 hours
  SELECT COUNT(*)
  INTO recent_count
  FROM bulten_uyeler
  WHERE email = p_email
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Allow if no recent subscription (0 means this is a new subscription)
  -- The UNIQUE constraint on email will prevent duplicates anyway
  RETURN recent_count = 0;
END;
$$;

-- Fix existing data with empty or short names before adding constraints
UPDATE public.bulten_uyeler 
SET ad_soyad = 'Bilinmiyor' 
WHERE LENGTH(ad_soyad) < 2;

-- Drop the existing public insert policy
DROP POLICY IF EXISTS "Public can insert newsletter subscribers" ON public.bulten_uyeler;

-- Create a new, more secure insert policy with rate limiting and validation
CREATE POLICY "Public can insert newsletter subscribers with validation"
ON public.bulten_uyeler FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Rate limit: prevent rapid repeated submissions
  check_newsletter_rate_limit(email)
  -- Email must be present and have basic format (@ symbol present)
  AND email IS NOT NULL 
  AND email LIKE '%@%.%'
  AND LENGTH(email) BETWEEN 5 AND 255
  -- Name must be present and reasonable length
  AND ad_soyad IS NOT NULL
  AND LENGTH(ad_soyad) BETWEEN 2 AND 100
  -- Province must be present
  AND il IS NOT NULL
  AND LENGTH(il) BETWEEN 2 AND 50
);