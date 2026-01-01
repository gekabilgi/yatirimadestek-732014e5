-- Fix cb_sessions and cb_messages RLS policies to prevent unauthorized access
-- The issue: anonymous users can access ANY session/message data

-- Drop the insecure policies on cb_sessions
DROP POLICY IF EXISTS "Anonymous users can create sessions" ON public.cb_sessions;
DROP POLICY IF EXISTS "Users can view sessions" ON public.cb_sessions;
DROP POLICY IF EXISTS "Users can update sessions" ON public.cb_sessions;
DROP POLICY IF EXISTS "Users can delete sessions" ON public.cb_sessions;
DROP POLICY IF EXISTS "cb_sessions_insert_owner" ON public.cb_sessions;

-- Drop the insecure policies on cb_messages
DROP POLICY IF EXISTS "Users can view their session messages" ON public.cb_messages;
DROP POLICY IF EXISTS "Users can insert to their sessions" ON public.cb_messages;
DROP POLICY IF EXISTS "Users can update their session messages" ON public.cb_messages;
DROP POLICY IF EXISTS "Users can delete their session messages" ON public.cb_messages;

-- Create secure policies for cb_sessions
-- For authenticated users: they can only access their own sessions
CREATE POLICY "Authenticated users can create their own sessions"
ON public.cb_sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can view their own sessions"
ON public.cb_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own sessions"
ON public.cb_sessions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can delete their own sessions"
ON public.cb_sessions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- For anonymous users: they can only create sessions with null user_id
-- and access sessions that match their client-provided session_id
-- We use a function to validate session ownership via the session_id header
CREATE OR REPLACE FUNCTION public.get_client_session_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT COALESCE(current_setting('request.headers', true)::json->>'x-session-id', '')
$$;

-- Anonymous users can create sessions without a user_id
CREATE POLICY "Anonymous users can create sessions without user_id"
ON public.cb_sessions FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Anonymous users can only view sessions matching their session_id header
CREATE POLICY "Anonymous users can view their own session by session_id"
ON public.cb_sessions FOR SELECT
TO anon
USING (session_id = public.get_client_session_id());

-- Anonymous users can only update sessions matching their session_id header
CREATE POLICY "Anonymous users can update their own session by session_id"
ON public.cb_sessions FOR UPDATE
TO anon
USING (session_id = public.get_client_session_id());

-- Anonymous users can only delete sessions matching their session_id header  
CREATE POLICY "Anonymous users can delete their own session by session_id"
ON public.cb_sessions FOR DELETE
TO anon
USING (session_id = public.get_client_session_id());

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all cb_sessions"
ON public.cb_sessions FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Create secure policies for cb_messages
-- Messages are scoped by session, so we validate session ownership

-- Authenticated users can only access messages from their own sessions
CREATE POLICY "Authenticated users can view messages from own sessions"
ON public.cb_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions s
    WHERE s.session_id = cb_messages.session_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can insert messages to own sessions"
ON public.cb_messages FOR INSERT
TO authenticated
WITH CHECK (
  check_chat_rate_limit(session_id) AND
  EXISTS (
    SELECT 1 FROM public.cb_sessions s
    WHERE s.session_id = cb_messages.session_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can update messages from own sessions"
ON public.cb_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions s
    WHERE s.session_id = cb_messages.session_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can delete messages from own sessions"
ON public.cb_messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions s
    WHERE s.session_id = cb_messages.session_id
    AND s.user_id = auth.uid()
  )
);

-- Anonymous users can only access messages from sessions they own (via session_id header)
CREATE POLICY "Anonymous users can view messages from own session"
ON public.cb_messages FOR SELECT
TO anon
USING (session_id = public.get_client_session_id());

CREATE POLICY "Anonymous users can insert messages to own session"
ON public.cb_messages FOR INSERT
TO anon
WITH CHECK (
  check_chat_rate_limit(session_id) AND
  session_id = public.get_client_session_id()
);

CREATE POLICY "Anonymous users can update messages from own session"
ON public.cb_messages FOR UPDATE
TO anon
USING (session_id = public.get_client_session_id());

CREATE POLICY "Anonymous users can delete messages from own session"
ON public.cb_messages FOR DELETE
TO anon
USING (session_id = public.get_client_session_id());

-- Admins can manage all messages
CREATE POLICY "Admins can manage all cb_messages"
ON public.cb_messages FOR ALL
TO authenticated
USING (is_admin(auth.uid()));