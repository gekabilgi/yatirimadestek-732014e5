import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ChatSource = 'chat_page' | 'floating_widget';
export type ChatStatType = 'session' | 'user_message' | 'assistant_message' | 'unique_session';

export const useChatbotStats = () => {
  // Increment chatbot statistics
  const trackChatStat = useCallback(async (
    source: ChatSource,
    statType: ChatStatType
  ) => {
    try {
      const { error } = await supabase.rpc('increment_chatbot_stat', {
        p_source: source,
        p_stat_type: statType
      });

      if (error) {
        console.error('Error tracking chat stat:', error);
      }
    } catch (error) {
      console.error('Error in trackChatStat:', error);
    }
  }, []);

  // Track when user sends a message
  const trackUserMessage = useCallback((source: ChatSource) => {
    trackChatStat(source, 'user_message');
    // Also increment app_statistics for realtime
    supabase.rpc('increment_stat', { 
      stat_name_param: source === 'chat_page' ? 'chat_page_messages' : 'floating_widget_messages' 
    });
  }, [trackChatStat]);

  // Track when assistant responds
  const trackAssistantMessage = useCallback((source: ChatSource) => {
    trackChatStat(source, 'assistant_message');
  }, [trackChatStat]);

  // Track new session
  const trackNewSession = useCallback((source: ChatSource) => {
    trackChatStat(source, 'session');
    // Also increment app_statistics for realtime
    supabase.rpc('increment_stat', { 
      stat_name_param: source === 'chat_page' ? 'chat_page_sessions' : 'floating_widget_sessions' 
    });
  }, [trackChatStat]);

  // Track unique session (first interaction)
  const trackUniqueSession = useCallback((source: ChatSource) => {
    const sessionKey = `chatbot_tracked_${source}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      trackChatStat(source, 'unique_session');
    }
  }, [trackChatStat]);

  return {
    trackUserMessage,
    trackAssistantMessage,
    trackNewSession,
    trackUniqueSession
  };
};
