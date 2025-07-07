
-- Create table for pre-request submissions (Ön Talep)
CREATE TABLE public.tedarik_zinciri_on_talep (
  id SERIAL PRIMARY KEY,
  firma_vergi_kimlik_no VARCHAR(11) NOT NULL CHECK (char_length(firma_vergi_kimlik_no) BETWEEN 10 AND 11),
  firma_adi TEXT NOT NULL,
  iletisim_kisi TEXT NOT NULL,
  unvan TEXT,
  telefon VARCHAR(13) NOT NULL CHECK (telefon ~ '^[1-9][0-9]{9,10}$'),
  e_posta TEXT NOT NULL CHECK (e_posta ~ '^[^@]+@[^@]+\.[^@]+$'),
  talep_icerigi TEXT NOT NULL CHECK (char_length(talep_icerigi) <= 1000),
  firma_kisa_adi VARCHAR(40),
  logo_url TEXT,
  dokuman_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  random_string VARCHAR(32) DEFAULT encode(gen_random_bytes(16), 'hex')
);

-- Create table for product demands (Ürün Talepleri)
CREATE TABLE public.tedarik_zinciri_urun_talep (
  id SERIAL PRIMARY KEY,
  on_talep_id INTEGER REFERENCES public.tedarik_zinciri_on_talep(id) ON DELETE CASCADE,
  urun_grubu_adi TEXT NOT NULL,
  basvuru_son_tarihi DATE NOT NULL,
  urun_aciklamasi TEXT NOT NULL CHECK (char_length(urun_aciklamasi) <= 1000),
  minimum_yerlilik_orani INTEGER NOT NULL CHECK (minimum_yerlilik_orani BETWEEN 0 AND 100),
  minimum_deneyim INTEGER NOT NULL CHECK (minimum_deneyim BETWEEN 0 AND 100),
  firma_olcegi TEXT NOT NULL CHECK (firma_olcegi IN ('Mikro', 'Küçük', 'Orta', 'Büyük')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for supplier applications (Tedarikçi Başvuruları)
CREATE TABLE public.tedarik_zinciri_tedarikci_basvuru (
  id SERIAL PRIMARY KEY,
  urun_talep_id INTEGER REFERENCES public.tedarik_zinciri_urun_talep(id) ON DELETE CASCADE,
  firma_vergi_kimlik_no VARCHAR(11) NOT NULL CHECK (char_length(firma_vergi_kimlik_no) BETWEEN 10 AND 11),
  firma_adi TEXT NOT NULL,
  iletisim_kisi TEXT NOT NULL,
  unvan TEXT,
  telefon VARCHAR(13) NOT NULL CHECK (telefon ~ '^[1-9][0-9]{9,10}$'),
  e_posta TEXT NOT NULL CHECK (e_posta ~ '^[^@]+@[^@]+\.[^@]+$'),
  il TEXT NOT NULL,
  firma_olcegi TEXT NOT NULL CHECK (firma_olcegi IN ('Mikro', 'Küçük', 'Orta', 'Büyük')),
  talep_icerigi TEXT NOT NULL CHECK (char_length(talep_icerigi) <= 1000),
  dokuman_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submission tracking table to prevent spam
CREATE TABLE public.tedarik_zinciri_submission_tracking (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL, -- VKN or email
  submission_type TEXT NOT NULL, -- 'on_talep' or 'tedarikci_basvuru'
  last_submission TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, submission_type)
);

-- Enable RLS for all tables
ALTER TABLE public.tedarik_zinciri_on_talep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tedarik_zinciri_urun_talep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tedarik_zinciri_tedarikci_basvuru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tedarik_zinciri_submission_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for on_talep table
CREATE POLICY "Public can submit on_talep" ON public.tedarik_zinciri_on_talep
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view active listings" ON public.tedarik_zinciri_on_talep
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage on_talep" ON public.tedarik_zinciri_on_talep
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for urun_talep table  
CREATE POLICY "Public can view active products" ON public.tedarik_zinciri_urun_talep
  FOR SELECT USING (is_active = true AND basvuru_son_tarihi >= CURRENT_DATE);

CREATE POLICY "Admin can manage urun_talep" ON public.tedarik_zinciri_urun_talep
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for tedarikci_basvuru table
CREATE POLICY "Public can submit applications" ON public.tedarik_zinciri_tedarikci_basvuru
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view applications" ON public.tedarik_zinciri_tedarikci_basvuru
  FOR SELECT USING (is_admin(auth.uid()));

-- RLS Policies for submission_tracking table
CREATE POLICY "System can manage tracking" ON public.tedarik_zinciri_submission_tracking
  FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_tedarik_zinciri_on_talep_updated_at 
  BEFORE UPDATE ON public.tedarik_zinciri_on_talep 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tedarik_zinciri_urun_talep_updated_at 
  BEFORE UPDATE ON public.tedarik_zinciri_urun_talep 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check spam submissions
CREATE OR REPLACE FUNCTION check_submission_spam(
  p_identifier TEXT,
  p_submission_type TEXT,
  p_cooldown_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_sub TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT last_submission INTO last_sub
  FROM public.tedarik_zinciri_submission_tracking
  WHERE identifier = p_identifier AND submission_type = p_submission_type;
  
  IF last_sub IS NULL THEN
    RETURN FALSE; -- No previous submission
  END IF;
  
  IF last_sub + (p_cooldown_minutes || ' minutes')::INTERVAL > NOW() THEN
    RETURN TRUE; -- Still in cooldown period
  END IF;
  
  RETURN FALSE; -- Cooldown period passed
END;
$$;

-- Create function to record submission
CREATE OR REPLACE FUNCTION record_submission(
  p_identifier TEXT,
  p_submission_type TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.tedarik_zinciri_submission_tracking (identifier, submission_type, last_submission)
  VALUES (p_identifier, p_submission_type, NOW())
  ON CONFLICT (identifier, submission_type)
  DO UPDATE SET last_submission = NOW();
END;
$$;
