-- Drop the incorrect RLS policy that uses profiles.role
DROP POLICY IF EXISTS "Only admins can manage domain menu settings" ON public.domain_menu_settings;

-- Create correct RLS policy using has_role function
CREATE POLICY "Only admins can manage domain menu settings" 
ON public.domain_menu_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));