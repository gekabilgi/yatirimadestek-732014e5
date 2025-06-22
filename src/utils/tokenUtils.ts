
import { supabase } from '@/integrations/supabase/client';

export interface YdoTokenPayload {
  email: string;
  province: string;
  exp: number;
  iat: number;
}

// Simple JWT-like token implementation for client-side use
export const generateYdoToken = (email: string, province: string): string => {
  const payload: YdoTokenPayload = {
    email,
    province,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Simple base64 encoding (in production, use proper JWT with server-side signing)
  return btoa(JSON.stringify(payload));
};

export const verifyYdoToken = (token: string): YdoTokenPayload | null => {
  try {
    const payload = JSON.parse(atob(token)) as YdoTokenPayload;
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};
