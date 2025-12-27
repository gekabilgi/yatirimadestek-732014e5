-- Fix document_chunks table - add RLS policies
-- This table stores knowledge base chunks for chatbot, should be admin-only for write, readable for search

-- Admin can manage document chunks
CREATE POLICY "Admins can manage document chunks" 
ON public.document_chunks 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to read for search purposes (embedding search)
CREATE POLICY "Authenticated users can read document chunks for search" 
ON public.document_chunks 
FOR SELECT 
TO authenticated
USING (true);

-- Service role can manage (for edge functions)
CREATE POLICY "Service role can manage document chunks" 
ON public.document_chunks 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);