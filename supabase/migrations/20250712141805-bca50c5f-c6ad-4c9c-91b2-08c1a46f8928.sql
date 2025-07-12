-- Remove the valid_vkn check constraint that's preventing the modified vergi_kimlik_no format
ALTER TABLE public.pre_requests DROP CONSTRAINT IF EXISTS valid_vkn;