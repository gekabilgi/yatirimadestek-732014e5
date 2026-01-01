-- Fix user_sessions public exposure - restrict read access to admins only
-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public can view session statistics" ON public.user_sessions;

-- Create admin-only read policy
CREATE POLICY "Only admins can view user sessions"
ON public.user_sessions FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Admins can manage all user sessions
CREATE POLICY "Admins can manage user sessions"
ON public.user_sessions FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));