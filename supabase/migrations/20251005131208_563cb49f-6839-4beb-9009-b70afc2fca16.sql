-- Enable realtime for document_uploads table
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_uploads;

-- Set replica identity to full for complete row data
ALTER TABLE public.document_uploads REPLICA IDENTITY FULL;