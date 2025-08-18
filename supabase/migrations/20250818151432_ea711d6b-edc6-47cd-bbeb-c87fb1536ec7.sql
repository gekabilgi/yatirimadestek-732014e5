-- CRITICAL SECURITY FIX: Secure qna_email_logs and qna_audit_trail tables
-- These tables contain sensitive operational data and should not be publicly accessible

-- Secure qna_email_logs table
ALTER TABLE public.qna_email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on qna_email_logs
DROP POLICY IF EXISTS "Admins can view all email logs" ON public.qna_email_logs;
DROP POLICY IF EXISTS "System can insert email logs" ON public.qna_email_logs;

-- Create secure policies for qna_email_logs
CREATE POLICY "Secure_Admins_view_email_logs" 
ON public.qna_email_logs 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Secure_System_insert_email_logs" 
ON public.qna_email_logs 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Secure qna_audit_trail table  
ALTER TABLE public.qna_audit_trail ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on qna_audit_trail
DROP POLICY IF EXISTS "Admins and YDO can view audit trail" ON public.qna_audit_trail;
DROP POLICY IF EXISTS "System can insert audit records" ON public.qna_audit_trail;

-- Create secure policies for qna_audit_trail
CREATE POLICY "Secure_Admins_YDO_view_audit_trail" 
ON public.qna_audit_trail 
FOR SELECT 
TO authenticated
USING (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM ydo_users 
    WHERE ydo_users.user_id = auth.uid()
  )
);

CREATE POLICY "Secure_System_insert_audit_records" 
ON public.qna_audit_trail 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Remove any remaining public access to sensitive tables
REVOKE ALL ON public.qna_email_logs FROM public;
REVOKE ALL ON public.qna_audit_trail FROM public;

-- Security verification: Operational data now properly secured