-- Grant appropriate privileges on soru_cevap
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soru_cevap TO authenticated;
GRANT INSERT ON public.soru_cevap TO anon;