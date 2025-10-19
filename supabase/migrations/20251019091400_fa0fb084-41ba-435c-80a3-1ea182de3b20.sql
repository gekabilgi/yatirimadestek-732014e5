-- Fix RLS for public access to answered/approved Q&A
-- Ensure only approved/public answers are readable by anonymous users

-- 1) Drop outdated/incorrect policy if present
DROP POLICY IF EXISTS "Public can view answered questions" ON public.soru_cevap;

-- 2) Create stricter policy allowing only approved/public answers
CREATE POLICY "Public can view approved answers"
ON public.soru_cevap
FOR SELECT
TO public
USING (
  answer IS NOT NULL
  AND btrim(answer) <> ''
  AND (
    lower(coalesce(answer_status, '')) = 'approved'
    OR sent_to_user = true
    OR admin_sent = true
  )
);

-- Optional: keep admin full access (if not already defined elsewhere)
DROP POLICY IF EXISTS "Admins can manage soru_cevap" ON public.soru_cevap;
CREATE POLICY "Admins can manage soru_cevap"
ON public.soru_cevap
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
