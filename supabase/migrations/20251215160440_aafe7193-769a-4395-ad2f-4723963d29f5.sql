-- Create bulten_uye_kurum_tercihleri table for subscriber institution preferences
CREATE TABLE public.bulten_uye_kurum_tercihleri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uye_id uuid NOT NULL REFERENCES public.bulten_uyeler(id) ON DELETE CASCADE,
  institution_id integer NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(uye_id, institution_id)
);

-- Enable RLS
ALTER TABLE public.bulten_uye_kurum_tercihleri ENABLE ROW LEVEL SECURITY;

-- Public can insert preferences during subscription
CREATE POLICY "Public can insert institution preferences"
ON public.bulten_uye_kurum_tercihleri
FOR INSERT
WITH CHECK (true);

-- Public can read institutions for form display
CREATE POLICY "Public can read institution preferences"
ON public.bulten_uye_kurum_tercihleri
FOR SELECT
USING (true);

-- Admins can manage all preferences
CREATE POLICY "Admins can manage institution preferences"
ON public.bulten_uye_kurum_tercihleri
FOR ALL
USING (is_admin(auth.uid()));