import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  priority: string; // Changed to string to match database
  created_at: string;
}

interface NotificationStats {
  totalToday: number;
  calculationsToday: number;
  searchesToday: number;
  activeSessions: number;
}

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats>({
    totalToday: 0,
    calculationsToday: 0,
    searchesToday: 0,
    activeSessions: 0
  });

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('real_time_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's activities
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('activity_type, created_at, session_id')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (sessionsError) throw sessionsError;

      // Count unique sessions today
      const uniqueSessions = new Set(sessionsData?.map(s => s.session_id) || []).size;
      
      // Count activities
      const calculationsToday = sessionsData?.filter(s => s.activity_type === 'calculation').length || 0;
      const searchesToday = sessionsData?.filter(s => s.activity_type === 'search').length || 0;
      
      // Get active sessions (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: activeData, error: activeError } = await supabase
        .from('user_sessions')
        .select('session_id')
        .gte('created_at', thirtyMinutesAgo);

      if (activeError) throw activeError;
      
      const activeSessions = new Set(activeData?.map(s => s.session_id) || []).size;

      setStats({
        totalToday: uniqueSessions,
        calculationsToday,
        searchesToday,
        activeSessions
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    fetchNotifications();
    fetchStats();

    // Subscribe to new notifications
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'real_time_notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'real_time_notifications'
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    // Subscribe to user sessions for stats updates
    const sessionsChannel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_sessions'
        },
        () => {
          // Refresh stats when new activity is tracked
          fetchStats();
        }
      )
      .subscribe();

    // Refresh stats every minute
    const statsInterval = setInterval(fetchStats, 60000);

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(sessionsChannel);
      clearInterval(statsInterval);
    };
  }, [fetchNotifications, fetchStats]);

  return {
    notifications,
    unreadCount,
    isLoading,
    stats,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    fetchStats
  };
};