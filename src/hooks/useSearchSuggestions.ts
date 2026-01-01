import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchSuggestion {
  suggestion_type: 'program' | 'institution' | 'tag';
  suggestion_text: string;
  suggestion_id: string;
  category_name: string | null;
}

export const useSearchSuggestions = () => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_search_suggestions', {
          query_text: query,
          suggestion_limit: 10
        });
        
        if (!error && data) {
          setSuggestions(data as SearchSuggestion[]);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, loading, fetchSuggestions, clearSuggestions };
};
