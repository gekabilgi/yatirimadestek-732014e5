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
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's activities
      const { data: todayData, error: todayError } = await supabase
        .from('user_sessions')
        .select('activity_type, session_id, created_at')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (todayError) throw todayError;

      // Count activities
      const calculationsToday = todayData?.filter(s => s.activity_type === 'calculation').length || 0;
      const searchesToday = todayData?.filter(s => s.activity_type === 'search').length || 0;
      const uniqueSessions = new Set(todayData?.map(s => s.session_id) || []).size;
      
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

      setStats({
        todayCalculations: calculationsToday,
        todaySearches: searchesToday,
        activeSessions,
        totalToday: uniqueSessions,
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

    // Set up real-time subscription
    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_sessions'
        },
        () => {
          // Refresh stats when new activity is tracked
          fetchActivityStats();
        }
      )
      .subscribe();

    // Refresh stats every minute
    const interval = setInterval(fetchActivityStats, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchActivityStats]);

  return {
    stats,
    isLoading,
    refetch: fetchActivityStats
  };
};