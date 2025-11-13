-- Allow public read access to chatbot settings (active store)
-- This is needed so the chatbot can read which store is active

CREATE POLICY "Public can read chatbot settings"
ON public.admin_settings
FOR SELECT
USING (category = 'chatbot');