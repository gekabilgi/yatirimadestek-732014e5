-- Create bulten_uyeler table for newsletter subscribers
CREATE TABLE public.bulten_uyeler (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  soyad TEXT NOT NULL,
  telefon TEXT,
  email TEXT NOT NULL UNIQUE,
  il TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bulten_uyeler ENABLE ROW LEVEL SECURITY;

-- Public can subscribe (insert)
CREATE POLICY "Public can subscribe to newsletter" 
ON public.bulten_uyeler 
FOR INSERT 
WITH CHECK (true);

-- Admins can manage subscribers
CREATE POLICY "Admins can manage newsletter subscribers" 
ON public.bulten_uyeler 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_bulten_uyeler_updated_at
BEFORE UPDATE ON public.bulten_uyeler
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create announcement_email_logs table to track sent emails
CREATE TABLE public.announcement_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  sent_by UUID,
  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.announcement_email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage email logs
CREATE POLICY "Admins can manage announcement email logs" 
ON public.announcement_email_logs 
FOR ALL 
USING (is_admin(auth.uid()));