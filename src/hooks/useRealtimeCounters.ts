import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CounterData {
  localCount: number;
  globalCount: number;
  isLoading: boolean;
  error: string | null;
}

export const useRealtimeCounters = (statName: string | string[]) => {
  const [data, setData] = useState<CounterData>({
    localCount: 0,
    globalCount: 0,
    isLoading: true,
    error: null
  });

  const statNames = Array.isArray(statName) ? statName : [statName];
  const localStorageKey = Array.isArray(statName) ? statName.join('_') : statName;

  // Get local count from localStorage
  const getLocalCount = useCallback(() => {
    try {
      const stored = localStorage.getItem(`counter_${localStorageKey}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }, [localStorageKey]);

  // Set local count to localStorage
  const setLocalCount = useCallback((count: number) => {
    try {
      localStorage.setItem(`counter_${localStorageKey}`, count.toString());
      setData(prev => ({ ...prev, localCount: count }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [localStorageKey]);

  // Fetch initial global count
  const fetchGlobalCount = useCallback(async () => {
    try {
      if (statNames.length === 1) {
        const { data: result, error } = await supabase
          .from('app_statistics')
          .select('stat_value')
          .eq('stat_name', statNames[0])
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No data found, create initial record
            const { error: insertError } = await supabase
              .from('app_statistics')
              .insert({ stat_name: statNames[0], stat_value: 0 });
            
            if (insertError) throw insertError;
            return 0;
          }
          throw error;
        }

        return result?.stat_value || 0;
      } else {
        // Handle multiple stat names (sum them)
        const { data: results, error } = await supabase
          .from('app_statistics')
          .select('stat_value')
          .in('stat_name', statNames);

        if (error) throw error;

        return results.reduce((sum, stat) => sum + (stat.stat_value || 0), 0);
      }
    } catch (error) {
      console.error('Error fetching global count:', error);
      setData(prev => ({ ...prev, error: 'Failed to load counter' }));
      return 0;
    }
  }, [statNames]);

  // Initialize counts
  useEffect(() => {
    const initializeCounts = async () => {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const localCount = getLocalCount();
      const globalCount = await fetchGlobalCount();
      
      setData(prev => ({
        ...prev,
        localCount,
        globalCount,
        isLoading: false
      }));
    };

    initializeCounts();
  }, [getLocalCount, fetchGlobalCount]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('counter-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_statistics'
        },
        (payload) => {
          if (payload.new?.stat_value !== undefined && statNames.includes(payload.new.stat_name)) {
            // Refetch total when any of our stat names change
            fetchGlobalCount().then(count => {
              setData(prev => ({
                ...prev,
                globalCount: count
              }));
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statNames, fetchGlobalCount]);

  // Increment counter function (only works with single stat name)
  const incrementCounter = useCallback(async () => {
    if (statNames.length > 1) {
      console.error('Cannot increment counter for multiple stat names');
      return;
    }

    // Optimistic local update
    const newLocalCount = data.localCount + 1;
    setLocalCount(newLocalCount);

    try {
      // Update global counter via edge function or direct increment
      const { error } = await supabase.rpc('increment_stat', {
        stat_name_param: statNames[0]
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error incrementing global counter:', error);
      // Revert local counter on error
      setLocalCount(newLocalCount - 1);
      setData(prev => ({ ...prev, error: 'Failed to update counter' }));
    }
  }, [data.localCount, setLocalCount, statNames]);

  return {
    localCount: data.localCount,
    globalCount: data.globalCount,
    totalCount: data.localCount + data.globalCount,
    isLoading: data.isLoading,
    error: data.error,
    incrementCounter
  };
};