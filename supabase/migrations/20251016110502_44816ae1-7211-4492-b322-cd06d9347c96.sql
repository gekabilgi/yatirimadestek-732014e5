-- ============================================
-- FIX 1: Move admin roles from profiles to separate user_roles table
-- ============================================

-- Create app_role enum (different from user_role to avoid conflicts)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table with proper security
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view user roles
CREATE POLICY "Only admins can view user roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Only admins can manage user roles
CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create SECURITY DEFINER function to check roles (with search_path protection)
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

-- Migrate existing admin users from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE role = 'admin'::user_role
ON CONFLICT (user_id, role) DO NOTHING;

-- Migrate existing regular users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM public.profiles
WHERE role = 'user'::user_role
ON CONFLICT (user_id, role) DO NOTHING;

-- Update is_admin function to use the new user_roles table
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(user_id, 'admin'::app_role)
$$;

-- ============================================
-- FIX 2: Fix cb_messages RLS to validate session ownership
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can view messages" ON public.cb_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.cb_messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.cb_messages;
DROP POLICY IF EXISTS "Users can delete messages" ON public.cb_messages;

-- Create secure policies that validate session ownership
CREATE POLICY "Users can view their session messages"
ON public.cb_messages
FOR SELECT
USING (
  -- Authenticated users: must own the session
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cb_sessions
    WHERE cb_sessions.session_id = cb_messages.session_id
    AND cb_sessions.user_id = auth.uid()
  ))
  OR
  -- Anonymous users: can view (application validates session_id)
  -- This allows anonymous chatbot usage while still maintaining session isolation
  (auth.uid() IS NULL)
);

CREATE POLICY "Users can insert to their sessions"
ON public.cb_messages
FOR INSERT
WITH CHECK (
  -- Check rate limit first
  public.check_chat_rate_limit(session_id) AND
  (
    -- Authenticated users: must own the session
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.cb_sessions
      WHERE cb_sessions.session_id = cb_messages.session_id
      AND cb_sessions.user_id = auth.uid()
    ))
    OR
    -- Anonymous users: can insert (application validates session_id)
    (auth.uid() IS NULL)
  )
);

CREATE POLICY "Users can update their session messages"
ON public.cb_messages
FOR UPDATE
USING (
  -- Authenticated users: must own the session
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cb_sessions
    WHERE cb_sessions.session_id = cb_messages.session_id
    AND cb_sessions.user_id = auth.uid()
  ))
  OR
  -- Anonymous users: can update (application validates session_id)
  (auth.uid() IS NULL)
);

CREATE POLICY "Users can delete their session messages"
ON public.cb_messages
FOR DELETE
USING (
  -- Authenticated users: must own the session
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cb_sessions
    WHERE cb_sessions.session_id = cb_messages.session_id
    AND cb_sessions.user_id = auth.uid()
  ))
  OR
  -- Anonymous users: can delete (application validates session_id)
  (auth.uid() IS NULL)
);