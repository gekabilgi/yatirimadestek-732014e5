import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const SESSIONS_KEY = 'chat_sessions';
const ACTIVE_SESSION_KEY = 'active_chat_session';

export function useChatSession() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  });

  const [isLoading, setIsLoading] = useState(false);

  const saveToStorage = useCallback((newSessions: ChatSession[]) => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
    setSessions(newSessions);
  }, []);

  const createSession = useCallback((title: string = 'New Chat') => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newSessions = [newSession, ...sessions];
    saveToStorage(newSessions);
    setActiveSessionId(newSession.id);
    localStorage.setItem(ACTIVE_SESSION_KEY, newSession.id);

    return newSession;
  }, [sessions, saveToStorage]);

  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    const newSessions = sessions.map(session =>
      session.id === sessionId
        ? { ...session, ...updates, updatedAt: Date.now() }
        : session
    );
    saveToStorage(newSessions);
  }, [sessions, saveToStorage]);

  const deleteSession = useCallback((sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId);
    saveToStorage(newSessions);
    
    if (activeSessionId === sessionId) {
      const newActiveId = newSessions[0]?.id || null;
      setActiveSessionId(newActiveId);
      if (newActiveId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, newActiveId);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    }
  }, [sessions, activeSessionId, saveToStorage]);

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
      };

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
    createSession,
    updateSession,
    deleteSession,
    sendMessage,
    setActiveSessionId: (id: string) => {
      setActiveSessionId(id);
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
    },
  };
}
