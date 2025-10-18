-- Add text column for storing visibility modes
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS setting_value_text TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_settings_category_key 
ON public.admin_settings(category, setting_key);

-- Update existing menu visibility settings to use new text column
-- Convert boolean values to visibility modes: false = 'anonymous_only', true = 'public'
UPDATE public.admin_settings
SET setting_value_text = CASE 
  WHEN setting_value = 0 THEN 'anonymous_only'
  WHEN setting_value = 1 THEN 'public'
  ELSE 'public'
END
WHERE category = 'menu_visibility' AND setting_value_text IS NULL;

COMMENT ON COLUMN public.admin_settings.setting_value_text IS 'Text value for settings like visibility modes: anonymous_only, admin_only, authenticated, public';