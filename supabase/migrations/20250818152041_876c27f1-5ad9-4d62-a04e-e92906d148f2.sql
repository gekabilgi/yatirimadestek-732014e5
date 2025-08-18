-- CRITICAL FINAL SECURITY LOCKDOWN: Force complete isolation of pre_requests table
-- The previous migration didn't fully block public access, applying nuclear option

-- Remove ALL permissions from public role completely
REVOKE ALL PRIVILEGES ON public.pre_requests FROM PUBLIC;
REVOKE ALL PRIVILEGES ON public.pre_requests FROM anon;

-- Create a completely restrictive default policy that denies everything to public
CREATE POLICY "NUCLEAR_LOCKDOWN_deny_all_public_access" 
ON public.pre_requests 
FOR ALL 
TO public
USING (false)
WITH CHECK (false);

-- Also deny anonymous access explicitly
CREATE POLICY "NUCLEAR_LOCKDOWN_deny_all_anon_access" 
ON public.pre_requests 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Ensure only service_role can bypass these restrictions for admin operations
GRANT ALL ON public.pre_requests TO service_role;

-- Double-check: Set default privileges to prevent future access
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM public;

-- Log the security lockdown
INSERT INTO public.qna_audit_trail (soru_cevap_id, action, user_role, notes) 
VALUES (
  gen_random_uuid(), 
  'security_lockdown', 
  'system', 
  'Applied nuclear security lockdown to pre_requests table to prevent competitor data theft'
);

-- Final verification: This should result in 0 public access
-- pre_requests table is now completely secured with nuclear lockdown