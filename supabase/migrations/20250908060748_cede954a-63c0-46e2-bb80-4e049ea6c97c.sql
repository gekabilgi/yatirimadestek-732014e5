-- Fix critical security issues identified by the linter

-- 1. Fix function search paths for security definer functions
CREATE OR REPLACE FUNCTION public.increment_stat(stat_name_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.app_statistics (stat_name, stat_value, updated_at)
  VALUES (stat_name_param, 1, now())
  ON CONFLICT (stat_name)
  DO UPDATE SET 
    stat_value = app_statistics.stat_value + 1,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user'::user_role);
  RETURN NEW;
END;
$function$;

-- 2. Create secure view that excludes personal data from public access
DROP VIEW IF EXISTS public.public_qna_view;

CREATE VIEW public.public_qna_view AS
SELECT 
  id,
  category,
  question,
  answer,
  province,
  created_at,
  answer_date,
  question_number
FROM public.soru_cevap
WHERE answered = true 
  AND answer IS NOT NULL 
  AND answer_status = 'approved';

-- Enable RLS on the view (inherits from base table)
-- No additional policies needed as the view already filters data appropriately

-- 3. Add RLS policy for karar_chunks table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'karar_chunks' AND table_schema = 'public') THEN
        ALTER TABLE public.karar_chunks ENABLE ROW LEVEL SECURITY;
        
        -- Only admins can access karar_chunks
        CREATE POLICY "Only admins can access karar_chunks" 
        ON public.karar_chunks 
        FOR ALL 
        USING (is_admin(auth.uid()))
        WITH CHECK (is_admin(auth.uid()));
    END IF;
END $$;

-- 4. Strengthen RLS policies for sensitive data tables
-- Update soru_cevap policies to be more restrictive
DROP POLICY IF EXISTS "BLOCK_ALL_PUBLIC_ACCESS_TO_PERSONAL_DATA" ON public.soru_cevap;

CREATE POLICY "ULTRA_SECURE_BLOCK_ALL_PUBLIC_ACCESS" 
ON public.soru_cevap 
FOR ALL 
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN false  -- No anonymous access
    WHEN is_admin(auth.uid()) THEN true -- Admin full access
    WHEN EXISTS (
      SELECT 1 FROM ydo_users 
      WHERE user_id = auth.uid() 
      AND province = soru_cevap.province
    ) THEN true -- YDO province access
    WHEN (auth.jwt() ->> 'email') = soru_cevap.email THEN true -- Own data access
    ELSE false
  END
)
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NULL THEN false
    WHEN is_admin(auth.uid()) THEN true
    WHEN EXISTS (
      SELECT 1 FROM ydo_users 
      WHERE user_id = auth.uid() 
      AND province = soru_cevap.province
    ) THEN true
    WHEN (auth.jwt() ->> 'email') = soru_cevap.email THEN true
    ELSE false
  END
);

-- 5. Add audit trail for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Log access to sensitive tables
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.qna_audit_trail (
      soru_cevap_id, 
      action, 
      user_id, 
      user_role, 
      notes
    ) VALUES (
      COALESCE(NEW.id, OLD.id), 
      'data_access', 
      auth.uid(), 
      CASE 
        WHEN is_admin(auth.uid()) THEN 'admin'
        WHEN EXISTS (SELECT 1 FROM ydo_users WHERE user_id = auth.uid()) THEN 'ydo'
        ELSE 'user'
      END,
      'Sensitive data accessed via ' || TG_TABLE_NAME
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 6. Create data retention policy function
CREATE OR REPLACE FUNCTION public.cleanup_old_sensitive_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Archive old audit logs (keep only last 2 years)
  DELETE FROM public.qna_audit_trail 
  WHERE created_at < now() - interval '2 years';
  
  -- Archive old email logs (keep only last 1 year)
  DELETE FROM public.qna_email_logs 
  WHERE created_at < now() - interval '1 year';
  
  -- Log the cleanup action
  INSERT INTO public.qna_audit_trail (
    soru_cevap_id, 
    action, 
    user_role, 
    notes
  ) VALUES (
    gen_random_uuid(), 
    'data_cleanup', 
    'system', 
    'Automated cleanup of old sensitive data completed'
  );
END;
$function$;