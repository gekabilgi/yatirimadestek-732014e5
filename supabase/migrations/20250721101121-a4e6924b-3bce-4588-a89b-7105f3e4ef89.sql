
-- Allow anonymous users to insert pre-requests (public form submission)
CREATE POLICY "Allow anonymous pre_request submissions" 
  ON public.pre_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read their own submissions for the "fetch previous data" feature
CREATE POLICY "Allow anonymous read for pre_requests by VKN" 
  ON public.pre_requests 
  FOR SELECT 
  USING (true);
