-- Fix security vulnerability in pre_requests table
-- Remove overly permissive policies that allow public access to sensitive business data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow anonymous read for pre_requests by VKN" ON pre_requests;
DROP POLICY IF EXISTS "Public can read approved pre_requests" ON pre_requests;
DROP POLICY IF EXISTS "Allow anonymous pre_request submissions" ON pre_requests;
DROP POLICY IF EXISTS "Public can submit pre_requests" ON pre_requests;

-- Create secure policies

-- 1. Allow companies to read only their own pre_requests (by email)
CREATE POLICY "Companies can read their own pre_requests" 
ON pre_requests 
FOR SELECT 
USING (
  -- Allow if user's email matches the pre_request email
  auth.jwt() ->> 'email' = e_posta
  OR
  -- Allow if user is authenticated and their profile email matches
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND email = pre_requests.e_posta
  ))
);

-- 2. Allow companies to update only their own pre_requests  
CREATE POLICY "Companies can update their own pre_requests"
ON pre_requests 
FOR UPDATE 
USING (
  auth.jwt() ->> 'email' = e_posta
  OR
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND email = pre_requests.e_posta
  ))
);

-- 3. Allow authenticated users to submit pre_requests with their email
CREATE POLICY "Authenticated users can submit pre_requests"
ON pre_requests 
FOR INSERT 
WITH CHECK (
  -- Ensure the user is inserting their own email
  (auth.uid() IS NOT NULL AND 
   (auth.jwt() ->> 'email' = e_posta OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email = pre_requests.e_posta)))
);

-- 4. Allow anonymous submissions (for public forms)
CREATE POLICY "Anonymous can submit pre_requests"
ON pre_requests 
FOR INSERT 
WITH CHECK (
  -- Allow anonymous submissions but require essential fields
  e_posta IS NOT NULL 
  AND firma_adi IS NOT NULL 
  AND vergi_kimlik_no IS NOT NULL
  AND iletisim_kisisi IS NOT NULL
  AND telefon IS NOT NULL
  AND talep_icerigi IS NOT NULL
);

-- 5. Create a view for public access to approved requests with limited data
CREATE OR REPLACE VIEW public.approved_pre_requests AS
SELECT 
  id,
  firma_adi,
  firma_kisa_adi,
  logo_url,
  created_at,
  status
FROM pre_requests 
WHERE status = 'approved';

-- Grant read access to the view
GRANT SELECT ON public.approved_pre_requests TO anon, authenticated;

-- Create RLS policy for the view (optional, but good practice)
ALTER VIEW public.approved_pre_requests SET (security_barrier = true);

-- Note: The existing "Admins can manage all pre_requests" policy remains active
-- This ensures administrators can still access all data for management purposes