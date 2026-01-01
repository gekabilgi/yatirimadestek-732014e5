-- Drop existing policies
DROP POLICY IF EXISTS "Public can insert newsletter subscribers with validation" ON public.bulten_uyeler;
DROP POLICY IF EXISTS "Only admins can read subscribers" ON public.bulten_uyeler;
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON public.bulten_uyeler;

-- Create proper RLS policies

-- 1. Admin SELECT policy - only admins can read subscriber data
CREATE POLICY "Admins can read newsletter subscribers" 
ON public.bulten_uyeler 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Admin full management policy for UPDATE/DELETE
CREATE POLICY "Admins can update newsletter subscribers" 
ON public.bulten_uyeler 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete newsletter subscribers" 
ON public.bulten_uyeler 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Public INSERT policy with validation (anyone can subscribe)
CREATE POLICY "Anyone can subscribe to newsletter with validation" 
ON public.bulten_uyeler 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  check_newsletter_rate_limit(email) AND 
  email IS NOT NULL AND 
  email ~~ '%@%.%' AND 
  length(email) >= 5 AND 
  length(email) <= 255 AND 
  ad_soyad IS NOT NULL AND 
  length(ad_soyad) >= 2 AND 
  length(ad_soyad) <= 100 AND 
  il IS NOT NULL AND 
  length(il) >= 2 AND 
  length(il) <= 50
);