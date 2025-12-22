-- Remove the existing cron job
SELECT cron.unschedule('daily-tcmb-exchange-update');

-- Create new cron job: weekdays only at 16:00 Turkey time (13:00 UTC)
SELECT cron.schedule(
  'daily-tcmb-exchange-update',
  '0 13 * * 1-5',
  $$
  SELECT
    net.http_post(
      url := 'https://zyxiznikuvpwmopraauj.supabase.co/functions/v1/tcmb-exchange',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eGl6bmlrdXZwd21vcHJhYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTc3MjIsImV4cCI6MjA2MjAzMzcyMn0.7f50sxr5xyMDVFLqvmZW1bxMTmLJFMGWNBKSiG-Wuxk"}'::jsonb,
      body := '{"source": "cron"}'::jsonb
    ) AS request_id;
  $$
);