
-- Create table for investment feasibility reports
CREATE TABLE public.investment_feasibility_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yatirim_konusu TEXT NOT NULL,
  fizibilitenin_hazirlanma_tarihi DATE,
  guncellenme_tarihi DATE,
  nace_kodu_tanim TEXT,
  gtip_kodu_tag TEXT,
  hedef_ulke_tag TEXT,
  ust_sektor_tanim_tag TEXT,
  alt_sektor_tanim_tag TEXT,
  sabit_yatirim_tutari_aralik_tag TEXT,
  kalkinma_ajansi_tag TEXT,
  il_tag TEXT,
  ska_tag TEXT,
  yatirim_boyutu_tag TEXT,
  keywords_tag TEXT,
  sabit_yatirim_tutari NUMERIC,
  istihdam INTEGER,
  geri_odeme_suresi NUMERIC,
  dokumanlar TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.investment_feasibility_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view feasibility reports" 
  ON public.investment_feasibility_reports 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage feasibility reports" 
  ON public.investment_feasibility_reports 
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_feasibility_reports_yatirim_konusu ON public.investment_feasibility_reports(yatirim_konusu);
CREATE INDEX idx_feasibility_reports_hazirlanma_tarihi ON public.investment_feasibility_reports(fizibilitenin_hazirlanma_tarihi);
CREATE INDEX idx_feasibility_reports_guncellenme_tarihi ON public.investment_feasibility_reports(guncellenme_tarihi);
CREATE INDEX idx_feasibility_reports_il_tag ON public.investment_feasibility_reports(il_tag);
CREATE INDEX idx_feasibility_reports_ska_tag ON public.investment_feasibility_reports(ska_tag);

-- Add trigger for updated_at
CREATE TRIGGER update_feasibility_reports_updated_at
  BEFORE UPDATE ON public.investment_feasibility_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
