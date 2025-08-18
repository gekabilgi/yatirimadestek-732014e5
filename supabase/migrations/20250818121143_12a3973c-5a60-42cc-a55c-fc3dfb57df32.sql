-- Create a security definer function that returns only safe, approved pre_request data
CREATE OR REPLACE FUNCTION public.get_approved_pre_requests()
RETURNS TABLE (
  id uuid,
  firma_adi character varying,
  firma_kisa_adi character varying,
  logo_url text,
  created_at timestamp with time zone,
  status character varying
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT 
    pr.id,
    pr.firma_adi,
    pr.firma_kisa_adi,
    pr.logo_url,
    pr.created_at,
    pr.status
  FROM pre_requests pr
  WHERE pr.status = 'approved';
$$;

-- Grant execute permission to public for the function
GRANT EXECUTE ON FUNCTION public.get_approved_pre_requests() TO anon, authenticated;