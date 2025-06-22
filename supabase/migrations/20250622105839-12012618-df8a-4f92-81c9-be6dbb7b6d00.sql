
-- Add new columns to soru_cevap table for enhanced answer management
ALTER TABLE public.soru_cevap 
ADD COLUMN IF NOT EXISTS answer_status TEXT DEFAULT 'unanswered' CHECK (answer_status IN ('unanswered', 'answered', 'returned', 'corrected', 'approved')),
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_date TIMESTAMP WITH TIME ZONE;

-- Update existing records to have proper status based on current state
UPDATE public.soru_cevap 
SET answer_status = CASE 
  WHEN sent_to_user = true THEN 'approved'
  WHEN answered = true THEN 'answered'
  ELSE 'unanswered'
END
WHERE answer_status = 'unanswered';

-- Update admin_sent based on sent_to_user
UPDATE public.soru_cevap 
SET admin_sent = sent_to_user 
WHERE admin_sent = false;

-- Create audit function for status changes
CREATE OR REPLACE FUNCTION public.log_answer_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log status changes
  IF OLD.answer_status IS DISTINCT FROM NEW.answer_status THEN
    PERFORM public.log_qna_audit(
      NEW.id, 
      'status_changed', 
      COALESCE(auth.jwt() ->> 'role', 'system'),
      'Status changed from ' || COALESCE(OLD.answer_status, 'null') || ' to ' || NEW.answer_status
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for status change logging
DROP TRIGGER IF EXISTS on_answer_status_change ON public.soru_cevap;
CREATE TRIGGER on_answer_status_change
  AFTER UPDATE ON public.soru_cevap
  FOR EACH ROW 
  WHEN (OLD.answer_status IS DISTINCT FROM NEW.answer_status)
  EXECUTE PROCEDURE public.log_answer_status_change();
