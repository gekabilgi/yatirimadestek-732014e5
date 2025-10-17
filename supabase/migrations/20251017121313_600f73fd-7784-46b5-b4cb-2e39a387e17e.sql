-- First, drop existing problematic policies on user_roles if they exist
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create safe RLS policies that don't cause recursion
-- Allow all authenticated users to read their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- For INSERT/UPDATE/DELETE on user_roles, we'll allow via a service role or edge function
-- We won't use is_admin() here to avoid recursion
-- Instead, we'll handle admin operations through the edge function with proper checks

-- Allow system/service to manage roles (this will be used by the edge function)
CREATE POLICY "Service can manage all user roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Now, let's make sure the current admin user is properly set up in user_roles
-- First, ensure the user exists in user_roles table with admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('8016988c-4ed9-4ba7-a880-d778d66f41d8', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Also, let's make sure profiles table has the correct RLS
-- Drop and recreate profiles policies to ensure they work correctly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow admins to view all profiles using the security definer function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Create similar policies for ydo_users and qna_admin_emails
-- Allow admins to view ydo_users
CREATE POLICY "Admins can view ydo_users"
ON public.ydo_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Allow admins to manage ydo_users
CREATE POLICY "Admins can manage ydo_users"
ON public.ydo_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Allow admins to view and manage qna_admin_emails
CREATE POLICY "Admins can manage qna emails"
ON public.qna_admin_emails
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);