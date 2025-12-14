-- Reset admin menu visibility settings to proper defaults
-- Enable all admin menu items for admin users

-- Delete the old Settings entry (no longer needed as it's always visible)
DELETE FROM admin_settings WHERE setting_key = 'admin_menu_settings' AND category = 'admin_menu_visibility';

-- Reset all admin menu items to be visible for admins
UPDATE admin_settings 
SET setting_value_text = '{"admin":true,"registered":false,"anonymous":false}'
WHERE category = 'admin_menu_visibility';

-- Insert Form Builder menu visibility if it doesn't exist
INSERT INTO admin_settings (setting_key, setting_value, setting_value_text, category, description)
VALUES ('admin_menu_form_builder', 0, '{"admin":true,"registered":false,"anonymous":false}', 'admin_menu_visibility', 'Form Builder menü görünürlüğü')
ON CONFLICT (setting_key) DO UPDATE SET setting_value_text = '{"admin":true,"registered":false,"anonymous":false}';