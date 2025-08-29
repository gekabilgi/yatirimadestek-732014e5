import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  const statNames = useMemo(() => Array.isArray(statName) ? statName : [statName], [statName]);
  const localStorageKey = useMemo(() => Array.isArray(statName) ? statName.join('_') : statName, [statName]);
  const initializedRef = useRef(false);

  // Set local count to localStorage
  const setLocalCount = useCallback((count: number) => {
    try {
      localStorage.setItem(`counter_${localStorageKey}`, count.toString());
      setData(prev => ({ ...prev, localCount: count }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [localStorageKey]);

  // Initialize counts - stable function that doesn't depend on other callbacks
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeCounts = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Get local count
        const stored = localStorage.getItem(`counter_${localStorageKey}`);
        const localCount = stored ? parseInt(stored, 10) : 0;
        
        // Fetch global count
        let globalCount = 0;
        if (statNames.length === 1) {
          const { data: result, error } = await supabase
            .from('app_statistics')
            .select('stat_value')
            .eq('stat_name', statNames[0])
            .single();

          if (error && error.code === 'PGRST116') {
            // No data found, create initial record
            await supabase
              .from('app_statistics')
              .insert({ stat_name: statNames[0], stat_value: 0 });
            globalCount = 0;
          } else if (error) {
            throw error;
          } else {
            globalCount = result?.stat_value || 0;
          }
        } else {
          // Handle multiple stat names (sum them)
          const { data: results, error } = await supabase
            .from('app_statistics')
            .select('stat_value')
            .in('stat_name', statNames);

          if (error) throw error;
          globalCount = results.reduce((sum, stat) => sum + (stat.stat_value || 0), 0);
        }
        
        setData({
          localCount,
          globalCount,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching global count:', error);
        setData(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to load counter' 
        }));
      }
    };

    initializeCounts();
  }, [statNames, localStorageKey]);

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
        async (payload) => {
          if (payload.new?.stat_value !== undefined && statNames.includes(payload.new.stat_name)) {
            // Refetch total when any of our stat names change
            try {
              let globalCount = 0;
              if (statNames.length === 1) {
                const { data: result } = await supabase
                  .from('app_statistics')
                  .select('stat_value')
                  .eq('stat_name', statNames[0])
                  .single();
                globalCount = result?.stat_value || 0;
              } else {
                const { data: results } = await supabase
                  .from('app_statistics')
                  .select('stat_value')
                  .in('stat_name', statNames);
                globalCount = results?.reduce((sum, stat) => sum + (stat.stat_value || 0), 0) || 0;
              }
              
              setData(prev => ({
                ...prev,
                globalCount
              }));
            } catch (error) {
              console.error('Error refetching global count:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statNames]);

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