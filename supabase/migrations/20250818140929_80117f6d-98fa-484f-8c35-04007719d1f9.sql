-- Fix security issue: Restrict supplier_applications table access to authenticated users only
-- Drop the insecure policy that allows public insertion
DROP POLICY IF EXISTS "Anyone can insert supplier_applications" ON public.supplier_applications;

-- Create new secure policy that requires authentication
-- Only authenticated users can submit supplier applications
CREATE POLICY "Authenticated users can submit supplier_applications" 
ON public.supplier_applications 
FOR INSERT 
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND
  (vergi_kimlik_no IS NOT NULL) AND 
  (firma_adi IS NOT NULL) AND 
  (iletisim_kisisi IS NOT NULL) AND 
  (unvan IS NOT NULL) AND 
  (firma_olcegi IS NOT NULL) AND 
  (telefon IS NOT NULL) AND 
  (e_posta IS NOT NULL) AND 
  (il IS NOT NULL) AND 
  (product_id IS NOT NULL)
);

-- Add policy for authenticated users to read their own applications
CREATE POLICY "Users can read their own supplier applications" 
ON public.supplier_applications 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    ((auth.jwt() ->> 'email'::text) = (e_posta)::text) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = (supplier_applications.e_posta)::text
    ))
  )
);

-- Add policy for authenticated users to update their own applications (if needed)
CREATE POLICY "Users can update their own supplier applications" 
ON public.supplier_applications 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    ((auth.jwt() ->> 'email'::text) = (e_posta)::text) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = (supplier_applications.e_posta)::text
    ))
  )
);