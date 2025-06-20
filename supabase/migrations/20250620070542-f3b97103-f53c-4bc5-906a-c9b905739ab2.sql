
-- Create enum for return status
CREATE TYPE return_status_enum AS ENUM ('returned', 'corrected');

-- Create main Q&A table
CREATE TABLE public.soru_cevap (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  province TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered BOOLEAN NOT NULL DEFAULT false,
  answer_date TIMESTAMP WITH TIME ZONE,
  sent_to_ydo BOOLEAN NOT NULL DEFAULT false,
  sent_to_user BOOLEAN NOT NULL DEFAULT false,
  return_status return_status_enum,
  admin_notes TEXT,
  answered_by_user_id UUID REFERENCES auth.users(id),
  approved_by_admin_id UUID REFERENCES auth.users(id)
);

-- Create YDO users table
CREATE TABLE public.ydo_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  province TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Q&A admin emails table
CREATE TABLE public.qna_admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit trail table for tracking all interactions
CREATE TABLE public.qna_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  soru_cevap_id UUID REFERENCES public.soru_cevap(id) NOT NULL,
  action TEXT NOT NULL, -- 'submitted', 'answered', 'returned', 'approved', 'sent_to_user'
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT, -- 'user', 'ydo', 'admin'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.soru_cevap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ydo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna_admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for soru_cevap
-- Anyone can insert (for question submission)
CREATE POLICY "Anyone can submit questions" 
  ON public.soru_cevap 
  FOR INSERT 
  WITH CHECK (true);

-- Users can view their own questions
CREATE POLICY "Users can view their own questions" 
  ON public.soru_cevap 
  FOR SELECT 
  USING (email = auth.jwt() ->> 'email' OR public.is_admin(auth.uid()));

-- YDO users can view questions from their province
CREATE POLICY "YDO users can view province questions" 
  ON public.soru_cevap 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.ydo_users 
      WHERE user_id = auth.uid() AND province = soru_cevap.province
    ) OR public.is_admin(auth.uid())
  );

-- YDO and admin users can update questions
CREATE POLICY "YDO and admin can update questions" 
  ON public.soru_cevap 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.ydo_users 
      WHERE user_id = auth.uid() AND province = soru_cevap.province
    ) OR public.is_admin(auth.uid())
  );

-- RLS Policies for ydo_users
CREATE POLICY "Admins can manage YDO users" 
  ON public.ydo_users 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "YDO users can view their own record" 
  ON public.ydo_users 
  FOR SELECT 
  USING (user_id = auth.uid());

-- RLS Policies for qna_admin_emails  
CREATE POLICY "Admins can manage admin emails" 
  ON public.qna_admin_emails 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

-- RLS Policies for audit trail
CREATE POLICY "Admins and YDO can view audit trail" 
  ON public.qna_audit_trail 
  FOR SELECT 
  USING (
    public.is_admin(auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.ydo_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit records" 
  ON public.qna_audit_trail 
  FOR INSERT 
  WITH CHECK (true);

-- Create function to log audit trail
CREATE OR REPLACE FUNCTION public.log_qna_audit(
  p_soru_cevap_id UUID,
  p_action TEXT,
  p_user_role TEXT DEFAULT 'user',
  p_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.qna_audit_trail (soru_cevap_id, action, user_id, user_role, notes)
  VALUES (p_soru_cevap_id, p_action, auth.uid(), p_user_role, p_notes);
END;
$$;

-- Create trigger to automatically log question submissions
CREATE OR REPLACE FUNCTION public.handle_new_question()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the question submission
  PERFORM public.log_qna_audit(NEW.id, 'submitted', 'user', 'Question submitted by user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_question_submitted
  AFTER INSERT ON public.soru_cevap
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_question();

-- Insert some sample provinces (you can add all 81)
INSERT INTO public.provinces (name, region_id) VALUES 
('Ankara', 2),
('İstanbul', 1),
('İzmir', 3),
('Bursa', 4),
('Antalya', 5),
('Adana', 6)
ON CONFLICT DO NOTHING;
