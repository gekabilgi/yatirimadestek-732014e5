-- Allow public to read appearance settings (like logo_color_mode)
CREATE POLICY "Public can read appearance settings"
ON admin_settings FOR SELECT
USING (category = 'appearance');