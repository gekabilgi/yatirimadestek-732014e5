-- Create announcements table
CREATE TABLE public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_name text NOT NULL,
  institution_logo text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL,
  announcement_date date NOT NULL DEFAULT CURRENT_DATE,
  external_link text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Public can view active announcements
CREATE POLICY "Public can view active announcements"
  ON public.announcements 
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all announcements
CREATE POLICY "Admins can manage announcements"
  ON public.announcements 
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create index for better performance
CREATE INDEX idx_announcements_active_date 
  ON public.announcements(is_active, announcement_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();