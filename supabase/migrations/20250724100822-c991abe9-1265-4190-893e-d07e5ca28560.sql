-- Add missing columns to supplier_applications table
ALTER TABLE public.supplier_applications 
ADD COLUMN dosyalar_url text,
ADD COLUMN firma_websitesi text,
ADD COLUMN minimum_yerlilik_orani integer,
ADD COLUMN tedarikci_deneyim_suresi integer,
ADD COLUMN notlar text,
ADD COLUMN on_request_id character varying;