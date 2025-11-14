import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: string[];
  groundingChunks?: Array<{
    web?: { uri: string; title: string };
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export function useChatSession() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load sessions from database
  const loadSessions = useCallback(async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const sessionsWithMessages = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          if (messagesError) throw messagesError;

          const messages: ChatMessage[] = (messagesData || []).map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime(),
            sources: msg.sources,
            groundingChunks: msg.grounding_chunks,
          }));

          // Generate title from first message
          const title = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '') || 'New Chat';

          return {
            id: session.id,
            title,
            messages,
            createdAt: new Date(session.created_at).getTime(),
            updatedAt: new Date(session.created_at).getTime(),
          };
        })
      );

      setSessions(sessionsWithMessages);
      
      // Set active session to first one if none selected
      if (!activeSessionId && sessionsWithMessages.length > 0) {
        setActiveSessionId(sessionsWithMessages[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [activeSessionId]);

  const createSession = useCallback(async (title: string = 'New Chat') => {
    try {
      const sessionId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('chat_sessions')
        .insert({ id: sessionId });

      if (error) throw error;

      const newSession: ChatSession = {
        id: sessionId,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(sessionId);

      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, []);

  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, ...updates, updatedAt: Date.now() }
        : session
    ));
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      // Delete messages first
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      // Delete session
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (activeSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remainingSessions[0]?.id || null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }, [sessions, activeSessionId]);

  const sendMessage = useCallback(async (
    sessionId: string,
    message: string,
    storeName: string
  ) => {
    setIsLoading(true);

    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      // Save user message to database
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: message,
        });

      const updatedMessages = [...session.messages, userMessage];
      updateSession(sessionId, { messages: updatedMessages });

      const { data, error } = await supabase.functions.invoke('chat-gemini', {
        body: {
          storeName,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.text,
        timestamp: Date.now(),
        sources: data.sources,
        groundingChunks: data.groundingChunks,
      };

      // Save assistant message to database
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: data.text,
          sources: data.sources,
          grounding_chunks: data.groundingChunks,
        });

      const finalMessages = [...updatedMessages, assistantMessage];
      updateSession(sessionId, { messages: finalMessages });

      // Auto-generate title from first user message
      if (session.messages.length === 0 && message.length > 0) {
        const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
        updateSession(sessionId, { title });
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [sessions, updateSession]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return {
    sessions,
    activeSession,
    activeSessionId,
    isLoading,
    loadSessions,
    createSession,
    updateSession,
    deleteSession,
    sendMessage,
    setActiveSessionId,
  };
}
