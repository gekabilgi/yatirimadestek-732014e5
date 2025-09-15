-- Add sub-region support setting to admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value, description, category)
VALUES (
  'sub_region_support_enabled', 
  0, 
  'Enable sub-region support for incentive calculations (0 = disabled, 1 = enabled)', 
  'incentive_calculations'
);