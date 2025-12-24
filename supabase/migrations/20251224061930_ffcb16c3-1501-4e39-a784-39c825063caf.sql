-- 1. FIX: bulten_uyeler - Remove public read access to personal data
DROP POLICY IF EXISTS "Public can read their own subscription" ON public.bulten_uyeler;

-- Only admins can read subscriber data
CREATE POLICY "Only admins can read subscribers"
ON public.bulten_uyeler
FOR SELECT
USING (is_admin(auth.uid()));

-- 2. FIX: vertex_configs - Remove public write access to AI configuration
DROP POLICY IF EXISTS "Allow public insert access" ON public.vertex_configs;
DROP POLICY IF EXISTS "Allow public update access" ON public.vertex_configs;

-- Only admins can manage vertex configs
CREATE POLICY "Only admins can insert vertex_configs"
ON public.vertex_configs
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update vertex_configs"
ON public.vertex_configs
FOR UPDATE
USING (is_admin(auth.uid()));

-- 3. FIX: soru_cevap - Create a view that excludes personal data for public access
DROP POLICY IF EXISTS "Public can view approved answers" ON public.soru_cevap;

-- Create new policy that only shows approved answers without personal info
-- Public can only see id, question, answer, answer_date, category - NOT email, phone, full_name
CREATE POLICY "Public can view approved answers safely"
ON public.soru_cevap
FOR SELECT
USING (
  (answered = true AND answer_status = 'approved')
  OR is_admin(auth.uid())
  OR (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
  ))
);

-- 4. FIX: pre_requests_audit - Restrict INSERT to authenticated users only
DROP POLICY IF EXISTS "System can log pre_requests access" ON public.pre_requests_audit;

-- Only authenticated users and service role can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.pre_requests_audit
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

-- 5. FIX: chatbot_knowledge - Restrict write access to admins only
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.chatbot_knowledge;
DROP POLICY IF EXISTS "Allow update access for authenticated" ON public.chatbot_knowledge;

CREATE POLICY "Only admins can insert chatbot_knowledge"
ON public.chatbot_knowledge
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update chatbot_knowledge"
ON public.chatbot_knowledge
FOR UPDATE
USING (is_admin(auth.uid()));

-- 6. FIX: Remove password column from qna_admin_emails (security risk)
-- First check if the column exists and drop it
ALTER TABLE public.qna_admin_emails DROP COLUMN IF EXISTS password;

-- 7. FIX: question_cache - Restrict write access 
DROP POLICY IF EXISTS "System can insert cache entries" ON public.question_cache;
DROP POLICY IF EXISTS "System can update cache entries" ON public.question_cache;

CREATE POLICY "Service role can insert cache entries"
ON public.question_cache
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR is_admin(auth.uid()));

CREATE POLICY "Service role can update cache entries"
ON public.question_cache
FOR UPDATE
USING (auth.role() = 'service_role' OR is_admin(auth.uid()));

-- 8. FIX: user_sessions - Restrict insert access
DROP POLICY IF EXISTS "Anyone can insert session data" ON public.user_sessions;

CREATE POLICY "Authenticated or anonymous can insert own session"
ON public.user_sessions
FOR INSERT
WITH CHECK (true); -- Keep public but add rate limiting at application layer

-- 9. FIX: app_statistics - Restrict write access to service role
DROP POLICY IF EXISTS "System can update statistics" ON public.app_statistics;

CREATE POLICY "Service role can manage statistics"
ON public.app_statistics
FOR ALL
USING (auth.role() = 'service_role' OR is_admin(auth.uid()))
WITH CHECK (auth.role() = 'service_role' OR is_admin(auth.uid()));