-- Fix recursion: remove admin check from user_roles policy to avoid self-referencing
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Remove unused function that selected from user_roles under admin context
DROP FUNCTION IF EXISTS public.get_all_user_roles();