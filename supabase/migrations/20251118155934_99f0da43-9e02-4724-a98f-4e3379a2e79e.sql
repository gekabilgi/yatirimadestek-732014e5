-- Step 2: Create user_metadata table and migrate data
CREATE TABLE IF NOT EXISTS public.user_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  province text,
  department text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_metadata
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_metadata
CREATE POLICY "Users can view their own metadata"
  ON public.user_metadata FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own metadata"
  ON public.user_metadata FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all metadata"
  ON public.user_metadata FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all metadata"
  ON public.user_metadata FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Migrate data from ydo_users to new structure
DO $$
DECLARE
  ydo_record RECORD;
BEGIN
  FOR ydo_record IN SELECT * FROM public.ydo_users LOOP
    IF ydo_record.user_id IS NOT NULL THEN
      -- Insert into profiles
      INSERT INTO public.profiles (id, email, role, created_at)
      VALUES (ydo_record.user_id, ydo_record.email, 'user', ydo_record.created_at)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();
      
      -- Add YDO role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (ydo_record.user_id, 'ydo')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      -- Add metadata
      INSERT INTO public.user_metadata (user_id, province, is_active, created_at)
      VALUES (ydo_record.user_id, ydo_record.province, true, ydo_record.created_at)
      ON CONFLICT (user_id) DO UPDATE SET
        province = EXCLUDED.province,
        updated_at = now();
    END IF;
  END LOOP;
END $$;

-- Migrate data from qna_admin_emails to new structure
DO $$
DECLARE
  qna_record RECORD;
  auth_user_id uuid;
BEGIN
  FOR qna_record IN SELECT * FROM public.qna_admin_emails LOOP
    SELECT id INTO auth_user_id FROM auth.users WHERE email = qna_record.email LIMIT 1;
    
    IF auth_user_id IS NOT NULL THEN
      -- Insert into profiles
      INSERT INTO public.profiles (id, email, role, created_at)
      VALUES (auth_user_id, qna_record.email, 'user', qna_record.created_at)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();
      
      -- Add QNA role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (auth_user_id, 'qna')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      -- Add metadata
      INSERT INTO public.user_metadata (user_id, is_active, created_at)
      VALUES (auth_user_id, qna_record.is_active, qna_record.created_at)
      ON CONFLICT (user_id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        updated_at = now();
    END IF;
  END LOOP;
END $$;

-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(role::text)
  FROM public.user_roles
  WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(p_user_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role::text = ANY(p_roles)
  );
$$;

-- Update RLS policies on soru_cevap
DROP POLICY IF EXISTS "YDO users can view questions from their province" ON public.soru_cevap;
CREATE POLICY "YDO users can view questions from their province"
  ON public.soru_cevap FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'ydo') AND
    province IN (SELECT m.province FROM public.user_metadata m WHERE m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "YDO users can answer questions from their province" ON public.soru_cevap;
CREATE POLICY "YDO users can answer questions from their province"
  ON public.soru_cevap FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'ydo') AND
    province IN (SELECT m.province FROM public.user_metadata m WHERE m.user_id = auth.uid())
  );