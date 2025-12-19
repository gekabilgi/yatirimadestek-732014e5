-- 1. Add user_id column to chat_sessions
ALTER TABLE chat_sessions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Delete existing orphan data (unowned sessions and messages)
DELETE FROM chat_messages WHERE session_id IN (SELECT id::text FROM chat_sessions);
DELETE FROM chat_sessions;

-- 3. Drop old RLS policies
DROP POLICY IF EXISTS "Allow public access to chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Allow public access to chat messages" ON chat_messages;

-- 4. Create new RLS policies for chat_sessions
CREATE POLICY "Users can view own sessions"
ON chat_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own sessions"
ON chat_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
ON chat_sessions FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
ON chat_sessions FOR DELETE
USING (user_id = auth.uid());

-- 5. Create new RLS policies for chat_messages
CREATE POLICY "Users can view messages from own sessions"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id::text = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to own sessions"
ON chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id::text = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages from own sessions"
ON chat_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id::text = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages from own sessions"
ON chat_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id::text = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);