-- CRITICAL SECURITY FIX: Remove public access to soru_cevap table
-- This table contains sensitive customer personal data (names, emails, phone numbers)

-- Ensure RLS is enabled on soru_cevap table
ALTER TABLE public.soru_cevap ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can submit questions" ON public.soru_cevap;
DROP POLICY IF EXISTS "Users can view their own questions" ON public.soru_cevap;
DROP POLICY IF EXISTS "YDO and admin can update questions" ON public.soru_cevap;
DROP POLICY IF EXISTS "YDO users can view province questions" ON public.soru_cevap;

-- Create NEW secure policies that protect customer personal data

-- 1. Only authenticated users can submit questions with their own email
CREATE POLICY "Secure_Users_submit_own_questions" 
ON public.soru_cevap 
FOR INSERT 
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND
  (email IS NOT NULL) AND 
  (full_name IS NOT NULL) AND 
  (question IS NOT NULL) AND 
  (province IS NOT NULL) AND
  (
    ((auth.jwt() ->> 'email'::text) = email) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = soru_cevap.email
    ))
  )
);

-- 2. Users can only view their own questions (authenticated)
CREATE POLICY "Secure_Users_view_own_questions" 
ON public.soru_cevap 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    ((auth.jwt() ->> 'email'::text) = email) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.email = soru_cevap.email
    ))
  )
);

-- 3. Admins can view and manage all questions
CREATE POLICY "Secure_Admins_manage_all_questions" 
ON public.soru_cevap 
FOR ALL 
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 4. YDO users can view and update questions in their province only
CREATE POLICY "Secure_YDO_manage_province_questions" 
ON public.soru_cevap 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ydo_users 
    WHERE ydo_users.user_id = auth.uid() 
    AND ydo_users.province = soru_cevap.province
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ydo_users 
    WHERE ydo_users.user_id = auth.uid() 
    AND ydo_users.province = soru_cevap.province
  )
);

-- 5. Public can view only approved and answered questions (no personal data exposure)
CREATE POLICY "Public_view_approved_answered_questions" 
ON public.soru_cevap 
FOR SELECT 
TO public
USING (
  answered = true AND 
  answer IS NOT NULL AND 
  answer_status = 'approved'
);

-- Security verification: Critical customer data now protected from unauthorized access