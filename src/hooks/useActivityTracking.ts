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

// Get user's accurate location using MaxMind GeoIP2
const getUserLocation = async () => {
  try {
    console.log('Starting location detection...');
    
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
    console.log('Got IP:', userIP);
    
    // Call our MaxMind edge function for geolocation with timeout
    const geoController = new AbortController();
    const geoTimeout = setTimeout(() => geoController.abort(), 5000);
    
    try {
      const { data: locationData, error } = await supabase.functions.invoke('ip-geolocation', {
        body: { ip: userIP }
      });
      clearTimeout(geoTimeout);
      
      if (error) {
        console.warn('MaxMind geolocation error:', error);
        throw new Error('MaxMind geolocation failed');
      }
      
      console.log('MaxMind success:', locationData);
      return {
        country: locationData.country || 'Turkey',
        city: locationData.city || 'Unknown',
        region: locationData.region,
        ip: userIP
      };
    } catch (geoError) {
      clearTimeout(geoTimeout);
      console.warn('MaxMind failed, using fallback:', geoError);
      
      // Fallback to basic location with the IP we already have
      return {
        country: 'Turkey',
        city: 'Unknown',
        region: 'Unknown',
        ip: userIP
      };
    }
    
  } catch (error) {
    console.error('Complete location detection failed:', error);
    // Final fallback
    return {
      country: 'Turkey',
      city: 'Unknown',
      region: 'Unknown',
      ip: 'Unknown'
    };
  }
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
      console.log(`Tracking activity: ${activityType}`, activityData);
      const location = await getUserLocation();
      console.log('Location for tracking:', location);
      
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
        console.error('Error inserting activity:', error);
      } else {
        console.log(`Successfully tracked ${activityType} activity`);
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