-- Update the check_submission_spam function to use the existing submission_tracking table
CREATE OR REPLACE FUNCTION public.check_submission_spam(p_identifier text, p_submission_type text, p_cooldown_minutes integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  last_sub TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT last_submission INTO last_sub
  FROM public.submission_tracking
  WHERE identifier = p_identifier AND submission_type = p_submission_type;
  
  IF last_sub IS NULL THEN
    RETURN FALSE; -- No previous submission
  END IF;
  
  IF last_sub + (p_cooldown_minutes || ' minutes')::INTERVAL > NOW() THEN
    RETURN TRUE; -- Still in cooldown period
  END IF;
  
  RETURN FALSE; -- Cooldown period passed
END;
$function$;

-- Update the record_submission function to use the existing submission_tracking table
CREATE OR REPLACE FUNCTION public.record_submission(p_identifier text, p_submission_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.submission_tracking (identifier, submission_type, last_submission, submission_count)
  VALUES (p_identifier, p_submission_type, NOW(), 1)
  ON CONFLICT (identifier, submission_type)
  DO UPDATE SET 
    last_submission = NOW(),
    submission_count = submission_tracking.submission_count + 1;
END;
$function$;