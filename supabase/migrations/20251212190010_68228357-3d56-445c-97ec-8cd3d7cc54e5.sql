-- Drop existing INSERT policy for form_submissions
DROP POLICY IF EXISTS "Anyone can submit forms" ON form_submissions;

-- Create new policy allowing anonymous submissions to public forms
CREATE POLICY "Anyone can submit to public forms" 
ON form_submissions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM form_templates 
    WHERE form_templates.id = form_id 
    AND form_templates.is_active = true 
    AND form_templates.is_public = true
  )
);