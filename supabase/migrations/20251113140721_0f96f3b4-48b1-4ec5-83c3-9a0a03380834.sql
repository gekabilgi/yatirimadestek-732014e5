-- Add active Gemini store setting to admin_settings
-- This will be used to store which RAG store is active for the chatbot across all devices

INSERT INTO public.admin_settings (setting_key, setting_value, description, category, setting_value_text)
VALUES (
  'active_gemini_store',
  0,
  'Active Gemini RAG store for chatbot (stored in setting_value_text field)',
  'chatbot',
  NULL
)
ON CONFLICT (setting_key) DO NOTHING;