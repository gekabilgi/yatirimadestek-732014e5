import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate a unique session ID for this browser session
const generateSessionId = () => {
  const stored = sessionStorage.getItem('user_session_id');
  if (stored) return stored;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('user_session_id', newId);
  return newId;
};

// Get user's approximate location using IP geolocation
const getUserLocation = async () => {
  try {
    // Using a more reliable IP service
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return {
        country: 'Turkey', // Default for Turkish site
        city: 'Unknown',
        ip: data.ip || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }
  
  return {
    country: 'Turkey',
    city: 'Unknown', 
    ip: 'Unknown'
  };
};

export const useActivityTracking = () => {
  const sessionId = generateSessionId();

  // Track user activity
  const trackActivity = useCallback(async (
    activityType: 'calculation' | 'search' | 'page_view' | 'session_start' | 'session_end',
    activityData?: any,
    pagePath?: string
  ) => {
    try {
      const location = await getUserLocation();
      
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          session_id: sessionId,
          ip_address: location.ip,
          location_country: location.country,
          location_city: location.city,
          user_agent: navigator.userAgent,
          page_path: pagePath || window.location.pathname,
          activity_type: activityType,
          activity_data: activityData
        });

      if (error) {
        console.error('Error tracking activity:', error);
      }
    } catch (error) {
      console.error('Error in trackActivity:', error);
    }
  }, [sessionId]);

  // Track page views
  const trackPageView = useCallback((path?: string) => {
    trackActivity('page_view', null, path);
  }, [trackActivity]);

  // Track calculations
  const trackCalculation = useCallback((calculationData: any) => {
    trackActivity('calculation', calculationData);
  }, [trackActivity]);

  // Track searches
  const trackSearch = useCallback((searchData: any) => {
    trackActivity('search', searchData);
  }, [trackActivity]);

  // Initialize session tracking
  useEffect(() => {
    // Track session start after a brief delay
    const timer = setTimeout(() => {
      trackActivity('session_start');
    }, 1000);

    // Track session end on page unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable tracking on page unload
      const location = { country: 'Turkey', city: 'Unknown', ip: 'Unknown' };
      navigator.sendBeacon('/api/track-session-end', JSON.stringify({
        sessionId,
        activityType: 'session_end',
        location
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