-- Enable public read access to user_sessions for homepage statistics
-- This allows anonymous users to see aggregated counts of searches and calculations

-- Drop the restrictive admin-only SELECT policy
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;

-- Create a new public SELECT policy that allows everyone to read session data
CREATE POLICY "Public can view session statistics"
  ON public.user_sessions
  FOR SELECT
  USING (true);

-- Keep the existing INSERT policy
-- (Anyone can insert session data policy already exists)