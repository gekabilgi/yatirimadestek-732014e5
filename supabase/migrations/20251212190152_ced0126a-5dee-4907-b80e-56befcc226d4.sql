-- Drop existing restrictive INSERT policies for form_submissions
DROP POLICY IF EXISTS "Anyone can submit to public forms" ON form_submissions;
DROP POLICY IF EXISTS "Anyone can submit to active public forms" ON form_submissions;

-- Create a PERMISSIVE policy for public form submissions
CREATE POLICY "Public can submit to active public forms" 
ON form_submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM form_templates 
    WHERE form_templates.id = form_id 
    AND form_templates.is_active = true 
    AND form_templates.is_public = true
  )
);