-- Add only the answered_by_full_name column to soru_cevap table
ALTER TABLE public.soru_cevap 
ADD COLUMN answered_by_full_name TEXT;