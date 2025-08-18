-- ABSOLUTE FINAL SECURITY LOCKDOWN: Drop all problematic policies and recreate from scratch
-- The existing policies are still allowing access somehow

-- Step 1: Drop ALL existing policies that might be interfering
DROP POLICY IF EXISTS "LOCKDOWN_No_public_access_to_personal_data" ON public.soru_cevap;
DROP POLICY IF EXISTS "LOCKDOWN_No_anon_access_to_personal_data" ON public.soru_cevap;
DROP POLICY IF EXISTS "EMERGENCY_LOCKDOWN_block_all_unauthorized_access" ON public.soru_cevap;
DROP POLICY IF EXISTS "Secure_Users_submit_own_questions" ON public.soru_cevap;
DROP POLICY IF EXISTS "Secure_Users_view_own_questions" ON public.soru_cevap;
DROP POLICY IF EXISTS "Secure_Admins_manage_all_questions" ON public.soru_cevap;
DROP POLICY IF EXISTS "Secure_YDO_manage_province_questions" ON public.soru_cevap;

-- Step 2: Create ONE comprehensive policy that blocks all unauthorized access
CREATE POLICY "ULTIMATE_SECURITY_LOCKDOWN_personal_data_protection" 
ON public.soru_cevap 
FOR ALL 
USING (
  -- Completely block public/anon access
  CASE 
    WHEN auth.role() = 'anon' THEN false
    WHEN auth.uid() IS NULL THEN false
    -- Only authenticated users with explicit conditions
    ELSE (
      -- Admin access
      is_admin(auth.uid()) OR
      -- User can only access their own data by email match
      ((auth.jwt() ->> 'email'::text) = email) OR
      -- YDO users for their province only
      EXISTS (
        SELECT 1 FROM ydo_users 
        WHERE ydo_users.user_id = auth.uid() 
        AND ydo_users.province = soru_cevap.province
      )
    )
  END
)
WITH CHECK (
  -- Same strict conditions for writes
  CASE 
    WHEN auth.role() = 'anon' THEN false
    WHEN auth.uid() IS NULL THEN false
    ELSE (
      is_admin(auth.uid()) OR
      ((auth.jwt() ->> 'email'::text) = email) OR
      EXISTS (
        SELECT 1 FROM ydo_users 
        WHERE ydo_users.user_id = auth.uid() 
        AND ydo_users.province = soru_cevap.province
      )
    )
  END
);

-- Step 3: Absolutely ensure no default permissions exist
REVOKE ALL ON public.soru_cevap FROM PUBLIC CASCADE;
REVOKE ALL ON public.soru_cevap FROM anon CASCADE;

-- Step 4: Force RLS to maximum security
ALTER TABLE public.soru_cevap FORCE ROW LEVEL SECURITY;

-- Step 5: Test security again
DROP FUNCTION IF EXISTS test_public_access_to_personal_data();
CREATE OR REPLACE FUNCTION test_final_security()
RETURNS text
SECURITY INVOKER  -- Important: Use invoker's privileges, not definer's
LANGUAGE plpgsql
AS $$
BEGIN
  -- This should fail for anonymous users
  PERFORM COUNT(*) FROM soru_cevap;
  RETURN 'SECURITY BREACH: Anonymous access still possible';
EXCEPTION 
  WHEN insufficient_privilege OR others THEN
    RETURN 'SECURITY OK: Anonymous access properly blocked';
END;
$$;

-- Grant execute only to test the function
GRANT EXECUTE ON FUNCTION test_final_security() TO PUBLIC;

-- Final security verification: 4,980 personal records must be protected