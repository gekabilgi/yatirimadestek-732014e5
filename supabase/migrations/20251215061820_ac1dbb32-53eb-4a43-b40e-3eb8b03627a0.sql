-- Add created_by column to support_programs table
ALTER TABLE public.support_programs 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Add comment for documentation
COMMENT ON COLUMN public.support_programs.created_by IS 'ID of the admin user who created this program';