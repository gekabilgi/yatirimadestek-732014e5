-- Create a security definer function to check if user has admin role
-- This avoids recursion in RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a security definer function to get all user roles for admins
CREATE OR REPLACE FUNCTION public.get_all_user_roles()
RETURNS TABLE (user_id uuid, role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, role
  FROM public.user_roles
  WHERE public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- Update user_roles policies to allow admins to view all roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Update profiles policies to use the security definer function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update ydo_users policies to use the security definer function
DROP POLICY IF EXISTS "Admins can view ydo_users" ON public.ydo_users;
DROP POLICY IF EXISTS "Admins can manage ydo_users" ON public.ydo_users;

CREATE POLICY "Admins can view ydo_users"
ON public.ydo_users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage ydo_users"
ON public.ydo_users
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Update qna_admin_emails policies to use the security definer function
DROP POLICY IF EXISTS "Admins can manage qna emails" ON public.qna_admin_emails;

CREATE POLICY "Admins can manage qna emails"
ON public.qna_admin_emails
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));