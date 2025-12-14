import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatbotSettings {
  showSources: boolean;
  isLoading: boolean;
}

export function useChatbotSettings(): ChatbotSettings {
  const [showSources, setShowSources] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'chatbot_show_sources')
          .single();

        if (!error && data) {
          setShowSources(data.setting_value === 1);
        }
      } catch (error) {
        console.error('Error loading chatbot settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('chatbot-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_settings',
          filter: `setting_key=eq.chatbot_show_sources`
        },
        (payload) => {
          if (payload.new && typeof (payload.new as any).setting_value === 'number') {
            setShowSources((payload.new as any).setting_value === 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { showSources, isLoading };
}
