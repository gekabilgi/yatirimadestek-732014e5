-- De-duplicate admin_settings rows by (category, setting_key) keeping the most recent
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY category, setting_key 
           ORDER BY updated_at DESC, created_at DESC, id DESC
         ) AS rn
  FROM public.admin_settings
), to_delete AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.admin_settings a
USING to_delete d
WHERE a.id = d.id;

-- Migrate old visibility text values to new JSON structure for menu_visibility category
UPDATE public.admin_settings
SET setting_value_text = CASE setting_value_text
  WHEN 'anonymous_only' THEN '{"admin":false,"registered":false,"anonymous":true}'
  WHEN 'admin_only'     THEN '{"admin":true,"registered":false,"anonymous":false}'
  WHEN 'authenticated'  THEN '{"admin":true,"registered":true,"anonymous":false}'
  WHEN 'public'         THEN '{"admin":true,"registered":true,"anonymous":true}'
  ELSE setting_value_text
END
WHERE category = 'menu_visibility';

-- Add unique constraint required for ON CONFLICT (category, setting_key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_settings_category_setting_key_unique'
  ) THEN
    ALTER TABLE public.admin_settings
    ADD CONSTRAINT admin_settings_category_setting_key_unique
    UNIQUE (category, setting_key);
  END IF;
END $$;