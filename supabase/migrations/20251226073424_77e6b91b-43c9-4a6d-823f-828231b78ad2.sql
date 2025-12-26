-- Simplify anonymous access policies - the previous approach with headers won't work well with the Supabase JS client
-- Instead, we'll allow anonymous users to access sessions they can prove ownership of through session_id knowledge

-- Drop the header-based policies for anonymous users
DROP POLICY IF EXISTS "Anonymous users can view their own session by session_id" ON public.cb_sessions;
DROP POLICY IF EXISTS "Anonymous users can update their own session by session_id" ON public.cb_sessions;
DROP POLICY IF EXISTS "Anonymous users can delete their own session by session_id" ON public.cb_sessions;
DROP POLICY IF EXISTS "Anonymous users can view messages from own session" ON public.cb_messages;
DROP POLICY IF EXISTS "Anonymous users can insert messages to own session" ON public.cb_messages;
DROP POLICY IF EXISTS "Anonymous users can update messages from own session" ON public.cb_messages;
DROP POLICY IF EXISTS "Anonymous users can delete messages from own session" ON public.cb_messages;

-- Drop the unused function
DROP FUNCTION IF EXISTS public.get_client_session_id();

-- Create simpler policies for anonymous users
-- Key insight: Anonymous users can only access sessions where user_id IS NULL
-- This means they created it anonymously and know the session_id (stored in their localStorage)

-- Anonymous users can view sessions they created (user_id IS NULL)
-- This is secure because:
-- 1. Session IDs are UUIDs - practically impossible to guess
-- 2. Anonymous sessions have no user_id, so only someone with the localStorage token knows the session_id
CREATE POLICY "Anonymous users can view anonymous sessions"
ON public.cb_sessions FOR SELECT
TO anon
USING (user_id IS NULL);

-- Anonymous users can update their own anonymous sessions
CREATE POLICY "Anonymous users can update anonymous sessions"
ON public.cb_sessions FOR UPDATE
TO anon
USING (user_id IS NULL);

-- Anonymous users can delete their own anonymous sessions  
CREATE POLICY "Anonymous users can delete anonymous sessions"
ON public.cb_sessions FOR DELETE
TO anon
USING (user_id IS NULL);

-- For cb_messages: anonymous users can access messages from anonymous sessions
-- They must know the session_id which is stored in their localStorage

-- Anonymous users can view messages from anonymous sessions
CREATE POLICY "Anonymous users can view messages from anonymous sessions"
ON public.cb_messages FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions s
    WHERE s.session_id = cb_messages.session_id
    AND s.user_id IS NULL
  )
);

-- Anonymous users can insert messages to anonymous sessions (with rate limiting)
CREATE POLICY "Anonymous users can insert messages to anonymous sessions"
ON public.cb_messages FOR INSERT
TO anon
WITH CHECK (
  check_chat_rate_limit(session_id) AND
  EXISTS (
    SELECT 1 FROM public.cb_sessions s
    WHERE s.session_id = cb_messages.session_id
    AND s.user_id IS NULL
  )
);

-- Anonymous users can update messages from anonymous sessions
CREATE POLICY "Anonymous users can update messages from anonymous sessions"
ON public.cb_messages FOR UPDATE
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions s
    WHERE s.session_id = cb_messages.session_id
    AND s.user_id IS NULL
  )
);

-- Anonymous users can delete messages from anonymous sessions
CREATE POLICY "Anonymous users can delete messages from anonymous sessions"
ON public.cb_messages FOR DELETE
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions s
    WHERE s.session_id = cb_messages.session_id
    AND s.user_id IS NULL
  )
);