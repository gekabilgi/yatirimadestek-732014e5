-- Create audit table for pre_requests access tracking
CREATE TABLE IF NOT EXISTS public.pre_requests_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_request_id UUID REFERENCES public.pre_requests(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  user_id UUID,
  user_role TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  notes TEXT
);

-- Enable RLS on audit table
ALTER TABLE public.pre_requests_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view pre_requests audit logs"
ON public.pre_requests_audit
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- System can insert audit records
CREATE POLICY "System can log pre_requests access"
ON public.pre_requests_audit
FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pre_requests_audit_request_id ON public.pre_requests_audit(pre_request_id);
CREATE INDEX IF NOT EXISTS idx_pre_requests_audit_user_id ON public.pre_requests_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_pre_requests_audit_accessed_at ON public.pre_requests_audit(accessed_at DESC);

-- Function to log pre_requests access
CREATE OR REPLACE FUNCTION public.log_pre_request_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_changed_fields JSONB;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Determine user role
  IF auth.uid() IS NULL THEN
    v_user_role := 'anonymous';
  ELSIF is_admin(auth.uid()) THEN
    v_user_role := 'admin';
  ELSE
    v_user_role := 'user';
  END IF;

  -- For UPDATE operations, track changed fields
  IF TG_OP = 'UPDATE' THEN
    v_changed_fields := jsonb_build_object();
    v_old_values := jsonb_build_object();
    v_new_values := jsonb_build_object();
    
    IF OLD.firma_adi IS DISTINCT FROM NEW.firma_adi THEN
      v_changed_fields := v_changed_fields || jsonb_build_object('firma_adi', true);
      v_old_values := v_old_values || jsonb_build_object('firma_adi', OLD.firma_adi);
      v_new_values := v_new_values || jsonb_build_object('firma_adi', NEW.firma_adi);
    END IF;
    
    IF OLD.vergi_kimlik_no IS DISTINCT FROM NEW.vergi_kimlik_no THEN
      v_changed_fields := v_changed_fields || jsonb_build_object('vergi_kimlik_no', true);
      v_old_values := v_old_values || jsonb_build_object('vergi_kimlik_no', '***MASKED***');
      v_new_values := v_new_values || jsonb_build_object('vergi_kimlik_no', '***MASKED***');
    END IF;
    
    IF OLD.e_posta IS DISTINCT FROM NEW.e_posta THEN
      v_changed_fields := v_changed_fields || jsonb_build_object('e_posta', true);
      v_old_values := v_old_values || jsonb_build_object('e_posta', OLD.e_posta);
      v_new_values := v_new_values || jsonb_build_object('e_posta', NEW.e_posta);
    END IF;
    
    IF OLD.telefon IS DISTINCT FROM NEW.telefon THEN
      v_changed_fields := v_changed_fields || jsonb_build_object('telefon', true);
      v_old_values := v_old_values || jsonb_build_object('telefon', OLD.telefon);
      v_new_values := v_new_values || jsonb_build_object('telefon', NEW.telefon);
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_changed_fields := v_changed_fields || jsonb_build_object('status', true);
      v_old_values := v_old_values || jsonb_build_object('status', OLD.status);
      v_new_values := v_new_values || jsonb_build_object('status', NEW.status);
    END IF;
  END IF;

  -- Log the access
  INSERT INTO public.pre_requests_audit (
    pre_request_id,
    action,
    user_id,
    user_role,
    changed_fields,
    old_values,
    new_values,
    notes
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    v_user_role,
    v_changed_fields,
    v_old_values,
    v_new_values,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New business request created'
      WHEN TG_OP = 'UPDATE' THEN 'Business request updated'
      WHEN TG_OP = 'DELETE' THEN 'Business request deleted'
      ELSE 'Business data accessed'
    END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for comprehensive audit logging
DROP TRIGGER IF EXISTS trg_pre_requests_audit_insert ON public.pre_requests;
CREATE TRIGGER trg_pre_requests_audit_insert
AFTER INSERT ON public.pre_requests
FOR EACH ROW
EXECUTE FUNCTION public.log_pre_request_access();

DROP TRIGGER IF EXISTS trg_pre_requests_audit_update ON public.pre_requests;
CREATE TRIGGER trg_pre_requests_audit_update
AFTER UPDATE ON public.pre_requests
FOR EACH ROW
EXECUTE FUNCTION public.log_pre_request_access();

DROP TRIGGER IF EXISTS trg_pre_requests_audit_delete ON public.pre_requests;
CREATE TRIGGER trg_pre_requests_audit_delete
AFTER DELETE ON public.pre_requests
FOR EACH ROW
EXECUTE FUNCTION public.log_pre_request_access();

-- Function to clean up old audit logs (data retention)
CREATE OR REPLACE FUNCTION public.cleanup_pre_requests_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Delete audit logs older than 2 years
  DELETE FROM public.pre_requests_audit
  WHERE accessed_at < now() - interval '2 years';
  
  -- Log the cleanup
  INSERT INTO public.pre_requests_audit (
    action,
    user_role,
    notes
  ) VALUES (
    'DELETE',
    'system',
    'Automated cleanup of audit logs older than 2 years'
  );
END;
$$;

-- Create a view for security monitoring (admins only)
CREATE OR REPLACE VIEW public.pre_requests_security_summary AS
SELECT 
  date_trunc('day', accessed_at) as access_date,
  action,
  user_role,
  COUNT(*) as access_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT pre_request_id) as unique_requests
FROM public.pre_requests_audit
WHERE accessed_at > now() - interval '30 days'
GROUP BY date_trunc('day', accessed_at), action, user_role
ORDER BY access_date DESC, access_count DESC;