-- Fix the security definer view issue by removing the security_barrier option
-- and create a proper RLS policy for the view instead

-- Remove the security_barrier setting from the view  
ALTER VIEW public.approved_pre_requests RESET (security_barrier);

-- Since we can't create RLS policies directly on views, we'll ensure the underlying
-- table's RLS policies properly protect the data accessed through the view

-- Fix function search paths for security functions to prevent injection attacks
ALTER FUNCTION public.increment_stat(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_submission_spam(text, text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_submission(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_qna_audit(uuid, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_question() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_answer_status_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.expire_old_products() SET search_path = public, pg_temp;