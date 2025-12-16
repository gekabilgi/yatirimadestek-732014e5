import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateUUID } from '@/lib/uuid';

export interface SupportProgramCardData {
  id: string;
  title: string;
  kurum: string;
  kurum_logo?: string;
  son_tarih?: string;
  ozet: string;
  uygunluk?: string;
  iletisim?: string;
  belgeler: Array<{ id: string; filename: string; file_url: string }>;
  tags: Array<{ id: number; name: string; category?: { id: number; name: string } }>;
  detay_link: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Array<{
    title: string;
    uri: string;
    snippet?: string;
    text?: string;
    index?: number; // [1], [2] referansları için
  }>;
  groundingChunks?: Array<{
    retrievedContext?: {
      uri?: string;
      title?: string;
      text?: string;
      customMetadata?: Array<{ key: string; stringValue?: string; value?: string }>;
    };
    web?: { uri: string; title: string }; // Keep for backward compatibility
    enrichedFileName?: string | null;
  }>;
  supportCards?: SupportProgramCardData[];
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
  const abortControllerRef = useRef<AbortController | null>(null);

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
          const title = messages.length > 0 && messages[0]?.content
            ? messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '')
            : 'New Chat';

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

      return sessionsWithMessages;
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }, [activeSessionId]);

  const createSession = useCallback(async (title: string = 'New Chat') => {
    try {
      const sessionId = generateUUID();
      
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
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Find session or create a temporary one if not found (race condition fix)
      let session = sessions.find(s => s.id === sessionId);
      if (!session) {
        console.warn('Session not found in local state, creating temporary session object');
        session = {
          id: sessionId,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

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

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const { data, error } = await supabase.functions.invoke('chat-gemini', {
        body: {
          storeName,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          sessionId,
        },
      });

      // Handle blocked/safety responses which may come back in data or in the error context
      let responseData: any = data;

      if (!responseData && error && (error as any).context?.json) {
        try {
          // FunctionsHttpError: context is a Response-like object
          const errorJson = await (error as any).context.json();
          responseData = errorJson;
        } catch (parseErr) {
          console.error('Failed to parse chat-gemini error JSON:', parseErr);
        }
      }

      if (responseData?.blocked) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: responseData.error || 'Üzgünüm, bu soruya güvenli bir şekilde cevap veremiyorum. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin.',
          timestamp: Date.now(),
        };

        // Save error message to database
        await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: errorMessage.content,
          });

        updateSession(sessionId, { messages: [...updatedMessages, errorMessage] });
        return;
      }

      // If there's an error and it's not a blocked/handled response, rethrow
      if (error) throw error;

      const fullResponse = data.text;
      const words = fullResponse.split(' ');
      
      // Add empty assistant message for streaming
      const assistantId = generateUUID();
      const emptyAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        sources: data.sources,
        groundingChunks: data.groundingChunks,
        supportCards: data.supportCards,
      };
      
      let streamingMessages = [...updatedMessages, emptyAssistantMessage];
      updateSession(sessionId, { messages: streamingMessages });

      // Stream words with typewriter effect
      let currentText = '';
      let wasAborted = false;
      
      for (let i = 0; i < words.length; i++) {
        // Check if aborted before processing each word
        if (abortControllerRef.current?.signal.aborted) {
          wasAborted = true;
          currentText += ' [yanıt durduruldu]';
          break;
        }
        
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        const updatedAssistantMessage: ChatMessage = {
          ...emptyAssistantMessage,
          content: currentText,
        };
        
        streamingMessages = [...updatedMessages, updatedAssistantMessage];
        updateSession(sessionId, { messages: streamingMessages });
        
        // Variable delay for natural typing
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
      }

      // Final assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: wasAborted ? currentText : fullResponse,
        timestamp: Date.now(),
        sources: wasAborted ? null : data.sources,
        groundingChunks: wasAborted ? null : data.groundingChunks,
        supportCards: wasAborted ? null : data.supportCards,
      };

      // Save assistant message to database
      const insertData: any = {
        session_id: sessionId,
        role: 'assistant',
        content: assistantMessage.content,
      };
      
      if (!wasAborted && data.sources) {
        insertData.sources = data.sources;
      }
      
      if (!wasAborted && data.groundingChunks) {
        insertData.grounding_chunks = data.groundingChunks;
      }
      
      await supabase
        .from('chat_messages')
        .insert(insertData);

      updateSession(sessionId, { messages: [...updatedMessages, assistantMessage] });

      if (wasAborted) {
        return { success: false, interrupted: true };
      }

      // Auto-generate title from first user message
      if (session.messages.length === 0 && message.length > 0) {
        const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
        updateSession(sessionId, { title });
      }

      return { success: true, data };
    } catch (error: any) {
      // Handle abort error gracefully
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return { success: false, aborted: true };
      }
      console.error('Error sending message:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessions, updateSession]);

  const stopGeneration = useCallback(() => {
    console.log('stopGeneration called');
    
    // Abort the controller
    if (abortControllerRef.current) {
      console.log('Aborting controller');
      abortControllerRef.current.abort();
    }
    
    setIsLoading(false);
  }, []);

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
    stopGeneration,
  };
}
