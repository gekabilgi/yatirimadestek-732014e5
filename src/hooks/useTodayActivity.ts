import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityData {
  id: string;
  session_id: string;
  activity_type: string;
  ip_address: string;
  location_country: string;
  location_city: string;
  page_path: string;
  activity_data: any;
  created_at: string;
}

interface TodayActivityStats {
  todayCalculations: number;
  todaySearches: number;
  activeSessions: number;
  totalToday: number;
  recentActivities: ActivityData[];
}

export const useTodayActivity = () => {
  const [stats, setStats] = useState<TodayActivityStats>({
    todayCalculations: 0,
    todaySearches: 0,
    activeSessions: 0,
    totalToday: 0,
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodayStats = useCallback(async () => {
    try {
      console.log('Fetching today activity stats...');
      
      // Get today's start (midnight in local timezone)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      // Get today's calculations and searches from user_sessions
      const { data: todayData, error: todayError } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('created_at', todayStart)
        .in('activity_type', ['calculation', 'search'])
        .order('created_at', { ascending: false });

      if (todayError) throw todayError;

      const todayCalculations = todayData?.filter(item => item.activity_type === 'calculation').length || 0;
      const todaySearches = todayData?.filter(item => item.activity_type === 'search').length || 0;
      
      // Get active sessions (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: activeData, error: activeError } = await supabase
        .from('user_sessions')
        .select('session_id')
        .gte('created_at', thirtyMinutesAgo);

      if (activeError) throw activeError;
      
      const activeSessions = new Set(activeData?.map(s => s.session_id) || []).size;

      console.log('Today activity stats fetched:', { todayCalculations, todaySearches, activeSessions });

      setStats({
        todayCalculations,
        todaySearches,
        activeSessions,
        totalToday: todayCalculations + todaySearches,
        recentActivities: todayData?.slice(0, 10) || []
      });
    } catch (error) {
      console.error('Error fetching today activity stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayStats();

    // Set up real-time subscription for user activity
    const activityChannel = supabase
      .channel('today-activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_sessions'
        },
        (payload) => {
          console.log('New user activity detected:', payload);
          // Refresh stats when new activity is tracked
          fetchTodayStats();
        }
      )
      .subscribe();

    // Refresh stats every minute to keep active sessions updated
    const interval = setInterval(fetchTodayStats, 60000);

    return () => {
      supabase.removeChannel(activityChannel);
      clearInterval(interval);
    };
  }, [fetchTodayStats]);

  return {
    stats,
    isLoading,
    refetch: fetchTodayStats
  };
};
