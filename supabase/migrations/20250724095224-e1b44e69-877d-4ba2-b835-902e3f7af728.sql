-- Create table for supplier applications
CREATE TABLE public.supplier_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  on_request_id VARCHAR NOT NULL,
  product_id UUID NOT NULL,
  vergi_kimlik_no VARCHAR(11) NOT NULL,
  firma_adi VARCHAR(255) NOT NULL,
  iletisim_kisisi VARCHAR(255) NOT NULL,
  unvan VARCHAR(255) NOT NULL,
  firma_olcegi VARCHAR(50) NOT NULL,
  telefon VARCHAR(10) NOT NULL,
  e_posta VARCHAR(255) NOT NULL,
  firma_websitesi VARCHAR(500),
  il VARCHAR(100) NOT NULL,
  minimum_yerlilik_orani INTEGER,
  tedarikci_deneyim_suresi INTEGER,
  notlar TEXT,
  dosyalar_url TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.supplier_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert supplier_applications" 
ON public.supplier_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can read all supplier_applications" 
ON public.supplier_applications 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_supplier_applications_updated_at
BEFORE UPDATE ON public.supplier_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_supplier_applications_on_request_id ON public.supplier_applications(on_request_id);
CREATE INDEX idx_supplier_applications_product_id ON public.supplier_applications(product_id);
CREATE INDEX idx_supplier_applications_vergi_kimlik_no ON public.supplier_applications(vergi_kimlik_no);