-- Add user_id column to user_sessions table to link sessions to authenticated users
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);

-- Drop existing RLS policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Admins can view all user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Service role can manage user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can insert user sessions" ON public.user_sessions;

-- Create policy for admins to view all sessions
CREATE POLICY "Admins can view all user sessions" 
ON public.user_sessions 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create policy for authenticated users to view their own sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to update their own sessions (to link user_id)
CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid());

-- Allow anyone to insert user sessions (for anonymous tracking)
CREATE POLICY "Anyone can insert user sessions" 
ON public.user_sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role can manage user sessions" 
ON public.user_sessions 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);