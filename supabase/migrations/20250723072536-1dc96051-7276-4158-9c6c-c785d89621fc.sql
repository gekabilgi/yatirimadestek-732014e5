-- Add primary key column to sgk_durations table
ALTER TABLE public.sgk_durations 
ADD COLUMN id SERIAL PRIMARY KEY;