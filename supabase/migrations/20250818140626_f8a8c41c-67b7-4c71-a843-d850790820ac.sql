-- Fix security issue: Restrict pre_requests table access to authenticated users only
-- Remove the current insecure policies and create new secure ones

-- Drop existing policies that allow public access to sensitive data
DROP POLICY IF EXISTS "Companies can read their own pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Companies can update their own pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Authenticated users can submit pre_requests" ON public.pre_requests;

-- Create new secure policies that only allow authenticated users
-- Companies can only read their own pre_requests (authenticated users only)
CREATE POLICY "Authenticated companies can read their own pre_requests" 
ON public.pre_requests 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    ((auth.jwt() ->> 'email'::text) = (e_posta)::text) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = (pre_requests.e_posta)::text
    ))
  )
);

-- Companies can only update their own pre_requests (authenticated users only)
CREATE POLICY "Authenticated companies can update their own pre_requests" 
ON public.pre_requests 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    ((auth.jwt() ->> 'email'::text) = (e_posta)::text) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = (pre_requests.e_posta)::text
    ))
  )
);

-- Authenticated users can submit pre_requests with proper validation
CREATE POLICY "Authenticated users can submit pre_requests" 
ON public.pre_requests 
FOR INSERT 
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND
  (e_posta IS NOT NULL) AND 
  (firma_adi IS NOT NULL) AND 
  (vergi_kimlik_no IS NOT NULL) AND 
  (iletisim_kisisi IS NOT NULL) AND 
  (telefon IS NOT NULL) AND 
  (talep_icerigi IS NOT NULL) AND
  (
    ((auth.jwt() ->> 'email'::text) = (e_posta)::text) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = (pre_requests.e_posta)::text
    ))
  )
);