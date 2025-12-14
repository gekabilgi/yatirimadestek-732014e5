-- Add display_mode column to form_templates table
ALTER TABLE form_templates 
ADD COLUMN display_mode TEXT DEFAULT 'standalone' CHECK (display_mode IN ('standalone', 'integrated'));