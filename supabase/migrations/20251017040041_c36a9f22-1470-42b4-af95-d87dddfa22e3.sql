-- Add menu visibility settings to admin_settings table
INSERT INTO admin_settings (setting_key, setting_value, category, description) VALUES
('menu_item_destek_arama', 1, 'menu_visibility', 'Destek Arama menü öğesinin herkese görünürlüğü'),
('menu_item_tesvik_araclari', 0, 'menu_visibility', 'Teşvik Araçları menü öğesinin herkese görünürlüğü'),
('menu_item_soru_cevap', 0, 'menu_visibility', 'Soru & Cevap menü öğesinin herkese görünürlüğü'),
('menu_item_tedarik_zinciri', 0, 'menu_visibility', 'Tedarik Zinciri menü öğesinin herkese görünürlüğü'),
('menu_item_yatirim_firsatlari', 0, 'menu_visibility', 'Yatırım Fırsatları menü öğesinin herkese görünürlüğü'),
('menu_item_yatirimci_sozlugu', 0, 'menu_visibility', 'Yatırımcı Sözlüğü menü öğesinin herkese görünürlüğü'),
('menu_item_basvuru_sureci', 0, 'menu_visibility', 'Başvuru Süreci menü öğesinin herkese görünürlüğü')
ON CONFLICT (setting_key) DO NOTHING;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can read menu visibility settings" ON admin_settings;

-- Create policy for public to read menu visibility settings
CREATE POLICY "Public can read menu visibility settings"
ON admin_settings
FOR SELECT
USING (category = 'menu_visibility');