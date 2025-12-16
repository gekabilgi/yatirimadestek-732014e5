-- Create domain_menu_settings table for domain-specific menu visibility
CREATE TABLE public.domain_menu_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL,
  menu_type VARCHAR(20) NOT NULL CHECK (menu_type IN ('frontend', 'admin')),
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(domain, menu_type)
);

-- Enable RLS
ALTER TABLE public.domain_menu_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Domain menu settings are publicly readable"
ON public.domain_menu_settings
FOR SELECT
USING (true);

-- Admin-only write access
CREATE POLICY "Only admins can manage domain menu settings"
ON public.domain_menu_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_domain_menu_settings_updated_at
BEFORE UPDATE ON public.domain_menu_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_bulten_uyeler_updated_at();