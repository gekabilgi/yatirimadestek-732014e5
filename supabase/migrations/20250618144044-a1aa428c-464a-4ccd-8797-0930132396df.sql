
-- First, create the user account in Supabase Auth (you'll need to do this through the Supabase dashboard)
-- Then run this command to promote the user to admin role

-- Update the user profile to admin role for kutlueser@gmail.com
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'kutlueser@gmail.com';

-- If the profile doesn't exist yet, insert it as admin
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'::user_role
FROM auth.users
WHERE email = 'kutlueser@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'kutlueser@gmail.com'
);
