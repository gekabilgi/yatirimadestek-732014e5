-- Fix admin policy to avoid recursion by using security definer function
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create admin policy using has_role security definer function
-- This avoids recursion because SECURITY DEFINER bypasses RLS
CREATE POLICY "Admins can manage all roles"
ON user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));