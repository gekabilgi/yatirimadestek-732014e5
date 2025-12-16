-- Add DELETE policy for admins on qna_email_logs
CREATE POLICY "Admins can delete email logs" 
ON public.qna_email_logs 
FOR DELETE 
USING (is_admin(auth.uid()));