-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on cron schema
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create daily cron job to update exchange rates at 09:00 AM Turkey time (06:00 UTC)
SELECT cron.schedule(
  'daily-tcmb-exchange-update',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://zyxiznikuvpwmopraauj.supabase.co/functions/v1/tcmb-exchange',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eGl6bmlrdXZwd21vcHJhYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTc3MjIsImV4cCI6MjA2MjAzMzcyMn0.7f50sxr5xyMDVFLqvmZW1bxMTmLJFMGWNBGSiK-Wuxk"}'::jsonb,
      body := '{"source": "cron"}'::jsonb
    ) AS request_id;
  $$
);