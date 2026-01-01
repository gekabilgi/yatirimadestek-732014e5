import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const RECAPTCHA_SITE_KEY = '6LcA-zssAAAAAERKTDvWOCh29uniQTItOk5p6whb';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export const useRecaptcha = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if script is already loaded
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setIsReady(true);
        setIsLoading(false);
      });
      return;
    }

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha.ready(() => {
        setIsReady(true);
        setIsLoading(false);
      });
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts during load
      const existingScript = document.querySelector(`script[src*="recaptcha"]`);
      if (existingScript && !window.grecaptcha) {
        existingScript.remove();
      }
    };
  }, []);

  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    if (!isReady || !window.grecaptcha) {
      console.warn('reCAPTCHA not ready');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      return null;
    }
  }, [isReady]);

  const verifyRecaptcha = useCallback(async (action: string): Promise<{ success: boolean; score?: number; error?: string }> => {
    const token = await executeRecaptcha(action);
    
    if (!token) {
      return { success: false, error: 'Failed to get reCAPTCHA token' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token, action }
      });

      if (error) {
        console.error('reCAPTCHA verification error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Error verifying reCAPTCHA:', error);
      return { success: false, error: error.message };
    }
  }, [executeRecaptcha]);

  return {
    isReady,
    isLoading,
    executeRecaptcha,
    verifyRecaptcha
  };
};
