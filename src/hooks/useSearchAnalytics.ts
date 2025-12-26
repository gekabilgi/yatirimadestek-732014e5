import { supabase } from "@/integrations/supabase/client";
import { useCallback, useRef } from "react";

export type SearchSource = 
  | 'chatbot' 
  | 'support_search' 
  | 'investment_search' 
  | 'glossary_search' 
  | 'incentive_query'
  | 'sector_search';

interface SearchMetadata {
  responseTimeMs?: number;
  resultsCount?: number;
  filters?: Record<string, unknown>;
  sessionId?: string;
}

export function useSearchAnalytics() {
  const lastQueryRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const trackSearch = useCallback(async (
    query: string, 
    source: SearchSource, 
    metadata?: SearchMetadata
  ) => {
    // Don't log empty queries
    if (!query || query.trim().length < 2) return;

    // Debounce: prevent duplicate logs for the same query within 1 second
    if (lastQueryRef.current === query.trim()) return;
    lastQueryRef.current = query.trim();

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to reset lastQuery after 2 seconds
    debounceTimerRef.current = setTimeout(() => {
      lastQueryRef.current = "";
    }, 2000);

    try {
      await supabase.from('hybrid_search_analytics').insert({
        query: query.trim(),
        search_source: source,
        total_response_time_ms: metadata?.responseTimeMs,
        support_match_count: metadata?.resultsCount,
        session_id: metadata?.sessionId,
        // Store filters in cache_key as JSON string if provided
        cache_key: metadata?.filters ? JSON.stringify(metadata.filters) : null,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.error('Failed to track search:', error);
    }
  }, []);

  const trackSearchWithTiming = useCallback(async <T>(
    query: string,
    source: SearchSource,
    searchFn: () => Promise<T>,
    getResultCount?: (result: T) => number,
    filters?: Record<string, unknown>
  ): Promise<T> => {
    const startTime = performance.now();
    const result = await searchFn();
    const endTime = performance.now();

    await trackSearch(query, source, {
      responseTimeMs: Math.round(endTime - startTime),
      resultsCount: getResultCount ? getResultCount(result) : undefined,
      filters,
    });

    return result;
  }, [trackSearch]);

  return { trackSearch, trackSearchWithTiming };
}
