-- Remove unique constraint on vergi_kimlik_no to allow multiple requests from same company
ALTER TABLE public.pre_requests DROP CONSTRAINT IF EXISTS pre_requests_vergi_kimlik_no_key;