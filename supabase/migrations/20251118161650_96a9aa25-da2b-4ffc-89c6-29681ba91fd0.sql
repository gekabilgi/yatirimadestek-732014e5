-- Add full_name column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name text;