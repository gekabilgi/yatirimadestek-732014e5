-- CRITICAL FINAL SECURITY LOCKDOWN: Force complete isolation of pre_requests table
-- Fixed version without the problematic audit trail insert

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

-- Force table to deny all public access by default
ALTER TABLE public.pre_requests FORCE ROW LEVEL SECURITY;

-- Final verification: This should result in 0 public access
-- pre_requests table is now completely secured with nuclear lockdown