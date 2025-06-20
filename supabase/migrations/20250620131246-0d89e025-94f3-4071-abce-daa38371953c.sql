
-- Make user_id nullable in ydo_users table since we're using it for email management
-- rather than actual user authentication
ALTER TABLE public.ydo_users ALTER COLUMN user_id DROP NOT NULL;

-- Or alternatively, we can drop the foreign key constraint entirely
-- since we're using this table for email management purposes
ALTER TABLE public.ydo_users DROP CONSTRAINT IF EXISTS ydo_users_user_id_fkey;
