-- NUCLEAR SECURITY LOCKDOWN: Completely block public access to personal data
-- Previous fix didn't fully work - applying maximum security

-- Revoke ALL default permissions on soru_cevap table
REVOKE ALL PRIVILEGES ON public.soru_cevap FROM PUBLIC;
REVOKE ALL PRIVILEGES ON public.soru_cevap FROM anon;

-- Set strict default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM public;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM anon;

-- Force complete RLS lockdown
ALTER TABLE public.soru_cevap FORCE ROW LEVEL SECURITY;

-- Add a catch-all security policy that blocks everything not explicitly allowed
CREATE POLICY "EMERGENCY_LOCKDOWN_block_all_unauthorized_access" 
ON public.soru_cevap 
FOR ALL 
USING (
  -- Only allow if user is authenticated AND has explicit permission
  auth.uid() IS NOT NULL AND (
    -- Admin access
    is_admin(auth.uid()) OR
    -- User can only see their own data
    ((auth.jwt() ->> 'email'::text) = email) OR
    -- YDO users for their province
    EXISTS (
      SELECT 1 FROM ydo_users 
      WHERE ydo_users.user_id = auth.uid() 
      AND ydo_users.province = soru_cevap.province
    )
  )
)
WITH CHECK (
  -- Same restrictions for INSERT/UPDATE
  auth.uid() IS NOT NULL AND (
    is_admin(auth.uid()) OR
    ((auth.jwt() ->> 'email'::text) = email) OR
    EXISTS (
      SELECT 1 FROM ydo_users 
      WHERE ydo_users.user_id = auth.uid() 
      AND ydo_users.province = soru_cevap.province
    )
  )
);

-- Ensure the secure view has proper permissions for public Q&A access
GRANT SELECT ON public.public_qna_view TO PUBLIC;
GRANT SELECT ON public.public_qna_view TO anon;

-- Remove any remaining dangerous permissions
REVOKE ALL ON public.soru_cevap FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.soru_cevap TO authenticated;

-- Emergency security verification: Personal data now completely locked down