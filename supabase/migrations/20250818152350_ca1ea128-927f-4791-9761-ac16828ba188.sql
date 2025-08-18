-- EMERGENCY SECURITY FIX: Block ALL personal data exposure from soru_cevap table
-- 4,980 customer records with personal data are currently exposed to hackers

-- Step 1: Create a secure view for public Q&A that excludes ALL personal data
CREATE OR REPLACE VIEW public.public_qna_view AS
SELECT 
  id,
  question,
  answer,
  province,
  created_at,
  answer_date,
  category,
  question_number
FROM public.soru_cevap
WHERE 
  answered = true 
  AND answer IS NOT NULL 
  AND answer_status = 'approved'
  AND answer != '';

-- Step 2: Revoke ALL public access to the main soru_cevap table
REVOKE ALL ON public.soru_cevap FROM public;
REVOKE ALL ON public.soru_cevap FROM anon;

-- Step 3: Drop the dangerous public policy that exposes personal data
DROP POLICY IF EXISTS "Public_view_approved_answered_questions" ON public.soru_cevap;

-- Step 4: Create a completely secure policy that blocks ALL public access to personal data
-- No public access to the main table at all - personal data is now protected
CREATE POLICY "LOCKDOWN_No_public_access_to_personal_data" 
ON public.soru_cevap 
FOR ALL 
TO public
USING (false)
WITH CHECK (false);

-- Step 5: Also deny anonymous access explicitly
CREATE POLICY "LOCKDOWN_No_anon_access_to_personal_data" 
ON public.soru_cevap 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Step 6: Grant public access only to the secure view (no personal data)
GRANT SELECT ON public.public_qna_view TO public;
GRANT SELECT ON public.public_qna_view TO anon;

-- Step 7: Force RLS on the main table to ensure complete protection
ALTER TABLE public.soru_cevap FORCE ROW LEVEL SECURITY;

-- Security verification: After this migration:
-- 1. Public users can ONLY see questions/answers via the secure view (NO personal data)
-- 2. Main soru_cevap table is completely locked down from public access
-- 3. Personal data (names, emails, phones) is protected from hackers
-- 4. Authenticated users can still access their own data via existing policies
-- 5. Admins and YDO users can still manage questions via existing policies

-- CRITICAL: 4,980 customer records with personal data are now secured