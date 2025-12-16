-- Persist support program cards with chat messages

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS support_cards jsonb;

ALTER TABLE public.cb_messages
ADD COLUMN IF NOT EXISTS support_cards jsonb;