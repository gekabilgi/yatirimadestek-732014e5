-- Critical Security Fix: Secure the approved_pre_requests view to prevent competitor access to sensitive business data
-- The current view exposes company names and business information publicly

-- First, drop the existing insecure view
DROP VIEW IF EXISTS public.approved_pre_requests;

-- Recreate the view with proper security: Only expose minimal public information for legitimate purposes
-- This view should only show basic company identifiers needed for public product listings, not sensitive business details
CREATE VIEW public.approved_pre_requests 
WITH (security_invoker = true) AS
SELECT 
  pr.id,
  pr.firma_kisa_adi,  -- Only short company name for display
  pr.logo_url,        -- Logo for UI purposes  
  pr.created_at,
  pr.status,
  pr.on_request_id    -- Needed for linking to product requests
FROM public.pre_requests pr
WHERE 
  pr.status = 'approved'
  -- Additional security: Only show companies that have active, non-expired products
  AND EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.pre_request_id = pr.id 
    AND p.status = 'active' 
    AND p.basvuru_son_tarihi > NOW()
  );

-- Add security comment
COMMENT ON VIEW public.approved_pre_requests IS 'Secure public view showing only minimal company information for active product requests. Excludes sensitive business data like full company names and tax IDs.';

-- The view inherits RLS from the underlying pre_requests table, which has proper security policies
-- Grant minimal access only for viewing active opportunities
GRANT SELECT ON public.approved_pre_requests TO anon;
GRANT SELECT ON public.approved_pre_requests TO authenticated;

-- Update the function to also follow the same security pattern
DROP FUNCTION IF EXISTS public.get_approved_pre_requests();

CREATE OR REPLACE FUNCTION public.get_approved_pre_requests()
RETURNS TABLE(
  id uuid,
  firma_kisa_adi character varying,
  logo_url text,
  created_at timestamp with time zone,
  status character varying,
  on_request_id character varying
)
LANGUAGE sql
STABLE SECURITY INVOKER
AS $$
  SELECT 
    apr.id,
    apr.firma_kisa_adi,
    apr.logo_url,
    apr.created_at,
    apr.status,
    apr.on_request_id
  FROM public.approved_pre_requests apr;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_approved_pre_requests() TO anon;
GRANT EXECUTE ON FUNCTION public.get_approved_pre_requests() TO authenticated;

-- Add security comment for function
COMMENT ON FUNCTION public.get_approved_pre_requests() IS 'Secure function to get approved pre-requests with minimal company information. Does not expose sensitive business data.';