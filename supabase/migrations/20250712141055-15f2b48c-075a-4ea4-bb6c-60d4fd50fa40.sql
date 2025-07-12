-- Increase the length of vergi_kimlik_no column to accommodate tax ID + random code
ALTER TABLE public.pre_requests ALTER COLUMN vergi_kimlik_no TYPE character varying(20);

-- Also update supplier_applications table for consistency  
ALTER TABLE public.supplier_applications ALTER COLUMN vergi_kimlik_no TYPE character varying(20);