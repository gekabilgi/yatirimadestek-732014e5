-- Add password column to qna_admin_emails table
ALTER TABLE public.qna_admin_emails 
ADD COLUMN password TEXT;