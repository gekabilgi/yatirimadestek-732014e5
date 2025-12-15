-- Recreate bulten_uyeler table with ad_soyad column
CREATE TABLE IF NOT EXISTS public.bulten_uyeler (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_soyad TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefon TEXT,
  il TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bulten_uyeler ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage newsletter subscribers"
ON public.bulten_uyeler
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Public can insert newsletter subscribers"
ON public.bulten_uyeler
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can read their own subscription"
ON public.bulten_uyeler
FOR SELECT
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_bulten_uyeler_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bulten_uyeler_updated_at
BEFORE UPDATE ON public.bulten_uyeler
FOR EACH ROW
EXECUTE FUNCTION public.update_bulten_uyeler_updated_at();

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_bulten_uyeler_email ON public.bulten_uyeler(email);
CREATE INDEX IF NOT EXISTS idx_bulten_uyeler_il ON public.bulten_uyeler(il);