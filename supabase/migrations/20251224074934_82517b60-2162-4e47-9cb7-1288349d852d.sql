-- Fix Security Definer View warning by setting SECURITY INVOKER
ALTER VIEW public.public_qna_view SET (security_invoker = on);

-- Also fix cache_statistics_view if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'cache_statistics_view') THEN
    ALTER VIEW public.cache_statistics_view SET (security_invoker = on);
  END IF;
END $$;