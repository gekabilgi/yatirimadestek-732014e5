
-- Create glossary_terms table
CREATE TABLE public.glossary_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better search performance
CREATE INDEX idx_glossary_terms_term ON public.glossary_terms USING gin(to_tsvector('turkish', term));
CREATE INDEX idx_glossary_terms_definition ON public.glossary_terms USING gin(to_tsvector('turkish', definition));
CREATE INDEX idx_glossary_terms_term_first_letter ON public.glossary_terms (upper(left(term, 1)));

-- Enable Row Level Security
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no authentication required)
CREATE POLICY "Anyone can view glossary terms" 
  ON public.glossary_terms 
  FOR SELECT 
  TO public
  USING (true);

-- Create policy for admin-only insert/update/delete
CREATE POLICY "Only admins can modify glossary terms" 
  ON public.glossary_terms 
  FOR ALL 
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_glossary_terms_updated_at
  BEFORE UPDATE ON public.glossary_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
