
-- Create email transaction log table
CREATE TABLE public.qna_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  soru_cevap_id UUID REFERENCES public.soru_cevap(id),
  sent_page TEXT NOT NULL, -- e.g., 'YDO Cevap Paneli', 'Admin Panel', 'User Notification'
  sender_email TEXT NOT NULL, -- e.g., 'sistem@yatirimadestek.gov.tr'
  recipient_email TEXT NOT NULL,
  sent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_subject TEXT NOT NULL,
  transmission_status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT, -- null if successful
  email_type TEXT NOT NULL, -- 'new_question', 'ydo_answer', 'admin_approval', 'answer_returned', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qna_email_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all email logs
CREATE POLICY "Admins can view all email logs" 
  ON public.qna_email_logs 
  FOR SELECT 
  USING (public.is_admin(auth.uid()));

-- System can insert email logs
CREATE POLICY "System can insert email logs" 
  ON public.qna_email_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_qna_email_logs_soru_cevap_id ON public.qna_email_logs(soru_cevap_id);
CREATE INDEX idx_qna_email_logs_sent_date ON public.qna_email_logs(sent_date DESC);
CREATE INDEX idx_qna_email_logs_email_type ON public.qna_email_logs(email_type);
