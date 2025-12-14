-- Add branding JSONB column to form_templates table
ALTER TABLE form_templates 
ADD COLUMN branding JSONB DEFAULT '{"show_header": false, "header_layout": "centered"}'::jsonb;