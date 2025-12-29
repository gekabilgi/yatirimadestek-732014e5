import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate a unique session ID for this browser session
const generateSessionId = () => {
  const stored = sessionStorage.getItem('user_session_id');
  if (stored) return stored;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('user_session_id', newId);
  return newId;
};

// Get current authenticated user ID
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
};

// Cached location data to avoid repeated API calls
let cachedLocation: { country: string; city: string; region: string; ip: string } | null = null;
let locationPromise: Promise<typeof cachedLocation> | null = null;

// Get user's accurate location using MaxMind GeoIP2 - with caching
const getUserLocation = async () => {
  // Return cached location if available
  if (cachedLocation) {
    return cachedLocation;
  }
  
  // If a request is already in progress, wait for it
  if (locationPromise) {
    return locationPromise;
  }
  
  locationPromise = (async () => {
    try {
      // First get the user's IP address with timeout
      const ipController = new AbortController();
      const ipTimeout = setTimeout(() => ipController.abort(), 3000);
      
      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        signal: ipController.signal
      });
      clearTimeout(ipTimeout);
      
      if (!ipResponse.ok) {
        throw new Error(`IP fetch failed: ${ipResponse.status}`);
      }
      
      const ipData = await ipResponse.json();
      const userIP = ipData.ip;
      
      // Call our MaxMind edge function for geolocation with timeout
      const geoController = new AbortController();
      const geoTimeout = setTimeout(() => geoController.abort(), 5000);
      
      try {
        const { data: locationData, error } = await supabase.functions.invoke('ip-geolocation', {
          body: { ip: userIP }
        });
        clearTimeout(geoTimeout);
        
        if (error) {
          throw new Error('MaxMind geolocation failed');
        }
        
        cachedLocation = {
          country: locationData.country || 'Turkey',
          city: locationData.city || 'Unknown',
          region: locationData.region,
          ip: userIP
        };
        return cachedLocation;
      } catch (geoError) {
        clearTimeout(geoTimeout);
        // Fallback to basic location with the IP we already have
        cachedLocation = {
          country: 'Turkey',
          city: 'Unknown',
          region: 'Unknown',
          ip: userIP
        };
        return cachedLocation;
      }
      
    } catch (error) {
      // Final fallback
      cachedLocation = {
        country: 'Turkey',
        city: 'Unknown',
        region: 'Unknown',
        ip: 'Unknown'
      };
      return cachedLocation;
    }
  })();
  
  return locationPromise;
};

export const useActivityTracking = () => {
  const sessionId = generateSessionId();
  const isInitialized = useRef(false);

  // Track user activity - deferred to not block initial render
  const trackActivity = useCallback(async (
    activityType: 'calculation' | 'search' | 'page_view' | 'session_start' | 'session_end',
    activityData?: any,
    pagePath?: string,
    contextData?: {
      moduleName?: string;
      searchTerm?: string;
      incentiveType?: string;
      investmentTopic?: string;
    }
  ) => {
  // Use requestIdleCallback for non-critical tracking
    const track = async () => {
      try {
        const [location, userId] = await Promise.all([
          getUserLocation(),
          getCurrentUserId()
        ]);
        
        await (supabase as any)
          .from('user_sessions')
          .insert({
            session_id: sessionId,
            user_id: userId,
            ip_address: location?.ip || 'Unknown',
            location_country: location?.country || 'Turkey',
            location_city: location?.city || 'Unknown',
            user_agent: navigator.userAgent,
            page_path: pagePath || window.location.pathname,
            activity_type: activityType,
            activity_data: activityData,
            module_name: contextData?.moduleName,
            search_term: contextData?.searchTerm,
            incentive_type: contextData?.incentiveType,
            investment_topic: contextData?.investmentTopic,
          });
      } catch (error) {
        // Silent fail - tracking should not break the app
        console.warn('Activity tracking failed:', error);
      }
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => track(), { timeout: 5000 });
    } else {
      setTimeout(track, 100);
    }
  }, [sessionId]);

  // Track page views
  const trackPageView = useCallback((path?: string) => {
    trackActivity('page_view', null, path);
  }, [trackActivity]);

  // Track calculations
  const trackCalculation = useCallback((
    calculationData: any,
    contextData?: {
      moduleName?: string;
      searchTerm?: string;
      incentiveType?: string;
      investmentTopic?: string;
    }
  ) => {
    trackActivity('calculation', calculationData, undefined, contextData);
  }, [trackActivity]);

  // Track searches
  const trackSearch = useCallback((
    searchData: any,
    contextData?: {
      moduleName?: string;
      searchTerm?: string;
      incentiveType?: string;
      investmentTopic?: string;
    }
  ) => {
    trackActivity('search', searchData, undefined, contextData);
  }, [trackActivity]);

  // Initialize session tracking - only once and deferred
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Defer session start tracking significantly
    const timer = setTimeout(() => {
      trackActivity('session_start');
    }, 3000); // Wait 3 seconds after page load

    // Track session end on page unload
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/track-session-end', JSON.stringify({
        sessionId,
        activityType: 'session_end',
        location: cachedLocation || { country: 'Turkey', city: 'Unknown', ip: 'Unknown' }
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackActivity, sessionId]);

  return {
    trackActivity,
    trackPageView,
    trackCalculation,
    trackSearch,
    sessionId
  };
};