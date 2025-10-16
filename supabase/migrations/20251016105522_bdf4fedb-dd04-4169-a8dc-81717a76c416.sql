-- ============================================
-- CRITICAL SECURITY FIX: Remove Anonymous Access to Chatbot Tables
-- ============================================

-- Fix Issue 1: Remove dangerous anonymous policies from cb_sessions
DROP POLICY IF EXISTS "allow_anon_delete" ON public.cb_sessions;
DROP POLICY IF EXISTS "allow_anon_insert" ON public.cb_sessions;
DROP POLICY IF EXISTS "allow_anon_select" ON public.cb_sessions;
DROP POLICY IF EXISTS "allow_anon_update" ON public.cb_sessions;

-- Keep only authenticated owner-based policies for cb_sessions
-- (cb_sessions_select_owner, cb_sessions_insert_owner, cb_sessions_update_owner, cb_sessions_delete_owner already exist)

-- Fix Issue 2: Remove dangerous anonymous policies from cb_messages
DROP POLICY IF EXISTS "allow_anon_delete" ON public.cb_messages;
DROP POLICY IF EXISTS "allow_anon_insert" ON public.cb_messages;
DROP POLICY IF EXISTS "allow_anon_select" ON public.cb_messages;
DROP POLICY IF EXISTS "allow_anon_update" ON public.cb_messages;
DROP POLICY IF EXISTS "allow_insert_cb_messages_to_public" ON public.cb_messages;
DROP POLICY IF EXISTS "allow_read_cb_messages_to_public" ON public.cb_messages;
DROP POLICY IF EXISTS "allow_update_cb_messages_to_public" ON public.cb_messages;

-- Create secure session-based policies for cb_messages
-- Users can only access messages from their own sessions
CREATE POLICY "Users can view their session messages"
ON public.cb_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions
    WHERE cb_sessions.session_id = cb_messages.session_id
    AND cb_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to their sessions"
ON public.cb_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cb_sessions
    WHERE cb_sessions.session_id = cb_messages.session_id
    AND cb_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their session messages"
ON public.cb_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions
    WHERE cb_sessions.session_id = cb_messages.session_id
    AND cb_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their session messages"
ON public.cb_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.cb_sessions
    WHERE cb_sessions.session_id = cb_messages.session_id
    AND cb_sessions.user_id = auth.uid()
  )
);

-- Fix Issue 3: Simplify and strengthen soru_cevap policies
-- Remove redundant and overlapping policies
DROP POLICY IF EXISTS "USER_OWN_DATA_ACCESS_ONLY" ON public.soru_cevap;
DROP POLICY IF EXISTS "USER_OWN_DATA_INSERT_ONLY" ON public.soru_cevap;
DROP POLICY IF EXISTS "USER_OWN_DATA_UPDATE_ONLY" ON public.soru_cevap;
DROP POLICY IF EXISTS "YDO_PROVINCE_ACCESS_ONLY" ON public.soru_cevap;
DROP POLICY IF EXISTS "ADMIN_FULL_ACCESS_TO_PERSONAL_DATA" ON public.soru_cevap;
DROP POLICY IF EXISTS "BLOCK_ALL_ANON_ACCESS_TO_PERSONAL_DATA" ON public.soru_cevap;

-- Keep only the comprehensive ULTRA_SECURE_BLOCK_ALL_PUBLIC_ACCESS policy
-- which already handles all access control correctly:
-- - Blocks all anonymous access (auth.uid() IS NULL)
-- - Allows admins full access
-- - Allows YDO users access to their province
-- - Allows users to access their own data via email match

COMMENT ON POLICY "ULTRA_SECURE_BLOCK_ALL_PUBLIC_ACCESS" ON public.soru_cevap IS 
'Comprehensive security policy: Blocks anonymous access, allows admins full access, YDO users province access, and users their own data';

-- Add index to improve performance of the remaining policy
CREATE INDEX IF NOT EXISTS idx_soru_cevap_email ON public.soru_cevap(email);
CREATE INDEX IF NOT EXISTS idx_soru_cevap_province ON public.soru_cevap(province);