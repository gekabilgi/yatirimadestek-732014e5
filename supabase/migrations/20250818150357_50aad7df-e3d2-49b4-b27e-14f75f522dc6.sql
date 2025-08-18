-- CRITICAL SECURITY FIX: Remove public access to pre_requests table
-- This table contains sensitive customer data (emails, phone numbers, tax IDs)

-- First, ensure RLS is enabled on pre_requests table
ALTER TABLE public.pre_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Anonymous can submit pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Authenticated companies can read their own pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Authenticated companies can update their own pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Authenticated users can submit pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Public can read approved pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Allow public read access to pre_requests" ON public.pre_requests;  
DROP POLICY IF EXISTS "Public read access" ON public.pre_requests;

-- Create NEW secure policies that protect customer data
-- 1. Only admins can manage all pre_requests
CREATE POLICY "Secure_Admins_manage_pre_requests" 
ON public.pre_requests 
FOR ALL 
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 2. Authenticated users can only submit pre_requests with their own email
CREATE POLICY "Secure_Users_submit_own_pre_requests" 
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
      WHERE profiles.id = auth.uid() AND profiles.email = (e_posta)::text
    ))
  )
);

-- 3. Authenticated users can only read their own pre_requests
CREATE POLICY "Secure_Users_read_own_pre_requests" 
ON public.pre_requests 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    ((auth.jwt() ->> 'email'::text) = (e_posta)::text) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = (e_posta)::text
    ))
  )
);

-- 4. Authenticated users can only update their own pre_requests
CREATE POLICY "Secure_Users_update_own_pre_requests" 
ON public.pre_requests 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    ((auth.jwt() ->> 'email'::text) = (e_posta)::text) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = (e_posta)::text
    ))
  )
);

-- Security verification: Ensure no public access remains
-- CRITICAL: Only authenticated users and admins can access this sensitive customer data