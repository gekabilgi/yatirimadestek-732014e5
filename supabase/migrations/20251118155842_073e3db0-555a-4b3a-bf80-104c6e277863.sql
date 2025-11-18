-- Step 1: Extend the app_role enum to include new roles (must be committed separately)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ydo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'qna';