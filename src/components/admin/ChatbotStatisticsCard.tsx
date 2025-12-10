import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Users, Bot, TrendingUp, Monitor, Smartphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatStats {
  chatPageMessages: number;
  floatingWidgetMessages: number;
  chatPageSessions: number;
  floatingWidgetSessions: number;
  todayStats: {
    chatPage: { messages: number; sessions: number };
    floatingWidget: { messages: number; sessions: number };
  };
}

export function ChatbotStatisticsCard() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('chatbot-stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_statistics',
        filter: 'stat_name=in.(chat_page_messages,floating_widget_messages,chat_page_sessions,floating_widget_sessions)'
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch from app_statistics
      const { data: appStats, error: appStatsError } = await supabase
        .from('app_statistics')
        .select('stat_name, stat_value')
        .in('stat_name', ['chat_page_messages', 'floating_widget_messages', 'chat_page_sessions', 'floating_widget_sessions']);

      if (appStatsError) throw appStatsError;

      // Fetch today's stats from chatbot_statistics
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData, error: todayError } = await supabase
        .from('chatbot_statistics')
        .select('*')
        .eq('date', today);

      if (todayError) throw todayError;

      const statMap = new Map(appStats?.map(s => [s.stat_name, s.stat_value]) || []);
      
      const chatPageToday = todayData?.find(d => d.source === 'chat_page');
      const widgetToday = todayData?.find(d => d.source === 'floating_widget');

      setStats({
        chatPageMessages: Number(statMap.get('chat_page_messages') || 0),
        floatingWidgetMessages: Number(statMap.get('floating_widget_messages') || 0),
        chatPageSessions: Number(statMap.get('chat_page_sessions') || 0),
        floatingWidgetSessions: Number(statMap.get('floating_widget_sessions') || 0),
        todayStats: {
          chatPage: {
            messages: chatPageToday?.messages_count || 0,
            sessions: chatPageToday?.sessions_count || 0
          },
          floatingWidget: {
            messages: widgetToday?.messages_count || 0,
            sessions: widgetToday?.sessions_count || 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching chatbot stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Chatbot İstatistikleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalMessages = (stats?.chatPageMessages || 0) + (stats?.floatingWidgetMessages || 0);
  const totalSessions = (stats?.chatPageSessions || 0) + (stats?.floatingWidgetSessions || 0);
  const todayTotalMessages = (stats?.todayStats.chatPage.messages || 0) + (stats?.todayStats.floatingWidget.messages || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Chatbot İstatistikleri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toplam İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">{totalMessages.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-muted-foreground">Toplam Mesaj</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">{totalSessions.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-muted-foreground">Toplam Oturum</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">{todayTotalMessages.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-muted-foreground">Bugün Mesaj</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <Bot className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">
              {((stats?.todayStats.chatPage.sessions || 0) + (stats?.todayStats.floatingWidget.sessions || 0)).toLocaleString('tr-TR')}
            </div>
            <div className="text-xs text-muted-foreground">Bugün Oturum</div>
          </div>
        </div>

        {/* Kaynak Karşılaştırması */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Kaynak Dağılımı</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Chat Page */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Chat Sayfası</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mesajlar:</span>
                  <span className="font-medium">{stats?.chatPageMessages.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oturumlar:</span>
                  <span className="font-medium">{stats?.chatPageSessions.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Bugün:</span>
                  <span className="font-medium">{stats?.todayStats.chatPage.messages} mesaj</span>
                </div>
              </div>
            </div>

            {/* Floating Widget */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Floating Widget</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mesajlar:</span>
                  <span className="font-medium">{stats?.floatingWidgetMessages.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oturumlar:</span>
                  <span className="font-medium">{stats?.floatingWidgetSessions.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Bugün:</span>
                  <span className="font-medium">{stats?.todayStats.floatingWidget.messages} mesaj</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kullanım Oranı */}
        {totalMessages > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Kullanım Oranları</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Chat Sayfası</span>
                  <span>{Math.round((stats?.chatPageMessages || 0) / totalMessages * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(stats?.chatPageMessages || 0) / totalMessages * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Floating Widget</span>
                  <span>{Math.round((stats?.floatingWidgetMessages || 0) / totalMessages * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/60 transition-all"
                    style={{ width: `${(stats?.floatingWidgetMessages || 0) / totalMessages * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
