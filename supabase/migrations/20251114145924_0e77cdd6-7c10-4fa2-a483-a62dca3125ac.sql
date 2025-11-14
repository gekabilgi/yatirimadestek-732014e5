-- Add sources and grounding_chunks columns to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS sources text[],
ADD COLUMN IF NOT EXISTS grounding_chunks jsonb;