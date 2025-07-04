
-- Create nacedortlu table for NACE codes
CREATE TABLE public.nacedortlu (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  desc TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gtipdortlu table for GTIP codes  
CREATE TABLE public.gtipdortlu (
  id SERIAL PRIMARY KEY,
  gtipcode TEXT NOT NULL UNIQUE,
  desc TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE public.nacedortlu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtipdortlu ENABLE ROW LEVEL SECURITY;

-- Create policies for nacedortlu table
CREATE POLICY "Anyone can view NACE codes" 
  ON public.nacedortlu 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify NACE codes" 
  ON public.nacedortlu 
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create policies for gtipdortlu table
CREATE POLICY "Anyone can view GTIP codes" 
  ON public.gtipdortlu 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify GTIP codes" 
  ON public.gtipdortlu 
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nacedortlu_updated_at 
  BEFORE UPDATE ON public.nacedortlu 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gtipdortlu_updated_at 
  BEFORE UPDATE ON public.gtipdortlu 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
