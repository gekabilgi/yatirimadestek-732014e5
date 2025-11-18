-- Add security tracking columns to user_metadata
ALTER TABLE user_metadata 
ADD COLUMN IF NOT EXISTS last_password_change timestamp with time zone,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;

-- Create function to track password changes
CREATE OR REPLACE FUNCTION track_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update last_password_change in user_metadata when password is updated
  UPDATE user_metadata
  SET last_password_change = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Note: Trigger on auth.users cannot be created directly
-- This will be handled via edge function after password change