-- Add on_request_id field to store the 6-digit random code separately
ALTER TABLE public.pre_requests ADD COLUMN on_request_id character varying(6);