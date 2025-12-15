-- Add DELETE policy for admins on qna_audit_trail
CREATE POLICY "Admins can delete audit trail" 
ON public.qna_audit_trail 
FOR DELETE 
USING (is_admin(auth.uid()));