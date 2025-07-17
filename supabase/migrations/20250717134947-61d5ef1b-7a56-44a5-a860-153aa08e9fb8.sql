
-- Create investments_by_province table
CREATE TABLE public.investments_by_province (
  id SERIAL PRIMARY KEY,
  province TEXT NOT NULL,
  investment_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.investments_by_province ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to investments_by_province" 
  ON public.investments_by_province 
  FOR SELECT 
  USING (true);

-- Create policy for admin management
CREATE POLICY "Allow admin full access to investments_by_province" 
  ON public.investments_by_province 
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
