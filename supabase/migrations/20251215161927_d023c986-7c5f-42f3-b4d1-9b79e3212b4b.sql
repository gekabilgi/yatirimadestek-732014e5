-- Rename ad column to ad_soyad and drop soyad column in bulten_uyeler table

-- First, update existing data to combine ad and soyad into ad column
UPDATE public.bulten_uyeler 
SET ad = TRIM(COALESCE(ad, '') || ' ' || COALESCE(soyad, ''));

-- Rename ad column to ad_soyad
ALTER TABLE public.bulten_uyeler 
RENAME COLUMN ad TO ad_soyad;

-- Drop soyad column
ALTER TABLE public.bulten_uyeler 
DROP COLUMN soyad;