-- Drop all problematic recursive policies on user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can view user roles" ON user_roles;

-- Keep only simple, non-recursive policies
-- Policy 1: Users can view their own roles (non-recursive, safe)
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Service role can manage all roles (bypasses RLS)
DROP POLICY IF EXISTS "Service can manage all user roles" ON user_roles;
CREATE POLICY "Service can manage all user roles"
ON user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: Admin role management will be handled via edge functions using service_role
-- This avoids the circular dependency of checking "is user admin" from within user_roles table