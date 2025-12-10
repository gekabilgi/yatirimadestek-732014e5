-- Create chatbot_statistics table for daily aggregated stats
CREATE TABLE public.chatbot_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  source text NOT NULL, -- 'chat_page' or 'floating_widget'
  sessions_count integer DEFAULT 0,
  messages_count integer DEFAULT 0,
  user_messages integer DEFAULT 0,
  assistant_messages integer DEFAULT 0,
  unique_sessions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, source)
);

-- Enable RLS
ALTER TABLE public.chatbot_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage chatbot statistics"
ON public.chatbot_statistics
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public can read chatbot statistics"
ON public.chatbot_statistics
FOR SELECT
USING (true);

-- Add source column to cb_messages (floating widget)
ALTER TABLE public.cb_messages ADD COLUMN IF NOT EXISTS source text DEFAULT 'floating_widget';

-- Add source column to chat_messages (chat page)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS source text DEFAULT 'chat_page';

-- Create function to increment chatbot statistics
CREATE OR REPLACE FUNCTION public.increment_chatbot_stat(
  p_source text,
  p_stat_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.chatbot_statistics (date, source, sessions_count, messages_count, user_messages, assistant_messages, unique_sessions)
  VALUES (CURRENT_DATE, p_source, 
    CASE WHEN p_stat_type = 'session' THEN 1 ELSE 0 END,
    CASE WHEN p_stat_type IN ('user_message', 'assistant_message') THEN 1 ELSE 0 END,
    CASE WHEN p_stat_type = 'user_message' THEN 1 ELSE 0 END,
    CASE WHEN p_stat_type = 'assistant_message' THEN 1 ELSE 0 END,
    CASE WHEN p_stat_type = 'unique_session' THEN 1 ELSE 0 END
  )
  ON CONFLICT (date, source)
  DO UPDATE SET 
    sessions_count = chatbot_statistics.sessions_count + CASE WHEN p_stat_type = 'session' THEN 1 ELSE 0 END,
    messages_count = chatbot_statistics.messages_count + CASE WHEN p_stat_type IN ('user_message', 'assistant_message') THEN 1 ELSE 0 END,
    user_messages = chatbot_statistics.user_messages + CASE WHEN p_stat_type = 'user_message' THEN 1 ELSE 0 END,
    assistant_messages = chatbot_statistics.assistant_messages + CASE WHEN p_stat_type = 'assistant_message' THEN 1 ELSE 0 END,
    unique_sessions = chatbot_statistics.unique_sessions + CASE WHEN p_stat_type = 'unique_session' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;

-- Add chatbot stats to app_statistics for realtime tracking
INSERT INTO public.app_statistics (stat_name, stat_value) VALUES 
  ('chat_page_messages', 0),
  ('floating_widget_messages', 0),
  ('chat_page_sessions', 0),
  ('floating_widget_sessions', 0)
ON CONFLICT (stat_name) DO NOTHING;