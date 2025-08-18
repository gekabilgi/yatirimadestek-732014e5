-- EMERGENCY SECURITY FIX: Block ALL public access to pre_requests table
-- This table contains highly sensitive business information that competitors could exploit

-- First, revoke ALL public permissions from the table
REVOKE ALL ON public.pre_requests FROM public;
REVOKE ALL ON public.pre_requests FROM anon;

-- Ensure RLS is enabled (should already be, but double-check)
ALTER TABLE public.pre_requests ENABLE ROW LEVEL SECURITY;

-- Drop any potentially permissive policies and recreate with strict access
DROP POLICY IF EXISTS "Secure_Admins_manage_pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Secure_Users_submit_own_pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Secure_Users_read_own_pre_requests" ON public.pre_requests;
DROP POLICY IF EXISTS "Secure_Users_update_own_pre_requests" ON public.pre_requests;

-- Create ultra-secure policies that block ALL public access

-- 1. Only admins can manage all pre_requests (no public access)
CREATE POLICY "Ultra_Secure_Admins_only_manage_pre_requests" 
ON public.pre_requests 
FOR ALL 
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 2. Authenticated users can ONLY submit pre_requests with verified email ownership
CREATE POLICY "Ultra_Secure_Users_submit_verified_pre_requests" 
ON public.pre_requests 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL AND
  -- All required fields must be provided
  e_posta IS NOT NULL AND 
  firma_adi IS NOT NULL AND 
  vergi_kimlik_no IS NOT NULL AND 
  iletisim_kisisi IS NOT NULL AND 
  telefon IS NOT NULL AND 
  talep_icerigi IS NOT NULL AND
  -- Email must match authenticated user
  (
    (auth.jwt() ->> 'email'::text) = e_posta::text OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = pre_requests.e_posta::text
    )
  )
);

-- 3. Authenticated users can ONLY read their own pre_requests (no public read)
CREATE POLICY "Ultra_Secure_Users_read_own_pre_requests_only" 
ON public.pre_requests 
FOR SELECT 
TO authenticated
USING (
  -- Must be authenticated
  auth.uid() IS NOT NULL AND
  -- Email must match authenticated user
  (
    (auth.jwt() ->> 'email'::text) = e_posta::text OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = pre_requests.e_posta::text
    )
  )
);

-- 4. Authenticated users can ONLY update their own pre_requests
CREATE POLICY "Ultra_Secure_Users_update_own_pre_requests_only" 
ON public.pre_requests 
FOR UPDATE 
TO authenticated
USING (
  -- Must be authenticated
  auth.uid() IS NOT NULL AND
  -- Email must match authenticated user
  (
    (auth.jwt() ->> 'email'::text) = e_posta::text OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = pre_requests.e_posta::text
    )
  )
);

-- CRITICAL: NO public/anon access policies are created
-- This ensures zero public access to sensitive business data

-- Verify security: After this migration, public users should see 0 records
-- Only authenticated users can see their own records
-- Only admins can see all records

-- Security verification comment
-- pre_requests table now secured against competitor data theft