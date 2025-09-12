-- Add VAT and Customs Duty rates to admin_settings
INSERT INTO admin_settings (setting_key, setting_value, description, category) VALUES 
('vat_rate', 20.0, 'VAT (KDV) rate percentage for machinery exemption calculations', 'incentive_calculation'),
('customs_duty_rate', 2.0, 'Customs duty rate percentage for imported machinery exemption calculations', 'incentive_calculation')
ON CONFLICT (setting_key) DO NOTHING;