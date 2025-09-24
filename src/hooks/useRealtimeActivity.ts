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

interface ActivityStats {
  todayCalculations: number;
  todaySearches: number;
  activeSessions: number;
  totalToday: number;
  recentActivities: ActivityData[];
}

export const useRealtimeActivity = () => {
  const [stats, setStats] = useState<ActivityStats>({
    todayCalculations: 0,
    todaySearches: 0,
    activeSessions: 0,
    totalToday: 0,
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivityStats = useCallback(async () => {
    try {
      console.log('Fetching activity stats...');
      
      // Get stats from app_statistics table (same as RealtimeStatsCard)
      const { data: appStats, error: appStatsError } = await supabase
        .from('app_statistics')
        .select('stat_name, stat_value')
        .in('stat_name', ['calculation_clicks', 'search_clicks']);

      if (appStatsError) throw appStatsError;

      const calculationsToday = appStats?.find(s => s.stat_name === 'calculation_clicks')?.stat_value || 0;
      const searchesToday = appStats?.find(s => s.stat_name === 'search_clicks')?.stat_value || 0;
      
      // Get active sessions (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: activeData, error: activeError } = await supabase
        .from('user_sessions')
        .select('session_id')
        .gte('created_at', thirtyMinutesAgo);

      if (activeError) throw activeError;
      
      const activeSessions = new Set(activeData?.map(s => s.session_id) || []).size;

      // Get recent activities with details
      const { data: recentData, error: recentError } = await supabase
        .from('user_sessions')
        .select('*')
        .in('activity_type', ['calculation', 'search'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      console.log('Activity stats fetched:', { calculationsToday, searchesToday, activeSessions });

      setStats({
        todayCalculations: calculationsToday,
        todaySearches: searchesToday,
        activeSessions,
        totalToday: calculationsToday + searchesToday,
        recentActivities: recentData || []
      });
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivityStats();

    // Set up real-time subscription for app_statistics table
    const statsChannel = supabase
      .channel('app-stats-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_statistics'
        },
        (payload) => {
          console.log('App statistics updated:', payload);
          // Refresh stats when app_statistics changes
          fetchActivityStats();
        }
      )
      .subscribe();

    // Set up real-time subscription for user activity
    const activityChannel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_sessions'
        },
        (payload) => {
          console.log('New user activity:', payload);
          // Refresh stats when new activity is tracked
          fetchActivityStats();
        }
      )
      .subscribe();

    // Refresh stats every minute
    const interval = setInterval(fetchActivityStats, 60000);

    return () => {
      supabase.removeChannel(statsChannel);
      supabase.removeChannel(activityChannel);
      clearInterval(interval);
    };
  }, [fetchActivityStats]);

  return {
    stats,
    isLoading,
    refetch: fetchActivityStats
  };
};