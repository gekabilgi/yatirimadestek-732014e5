import { supabase } from '@/integrations/supabase/client';

export interface YdoTokenPayload {
  email: string;
  province: string;
  exp: number;
  iat: number;
}

// Client-side JWT decoder (payload only - signature verification happens server-side)
// This is safe because all sensitive operations are validated server-side via the edge function
export function decodeTokenPayload(token: string): YdoTokenPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const padded = payloadBase64 + '='.repeat((4 - payloadBase64.length % 4) % 4);
    
    const jsonStr = atob(padded);
    const payload = JSON.parse(jsonStr) as YdoTokenPayload;
    
    // Basic client-side expiration check (server will also verify)
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      console.error('Token expired');
      return null;
    }
    
    // Validate required fields
    if (!payload.email || !payload.province) {
      console.error('Missing required fields in token');
      return null;
    }
    
    console.log('Token payload decoded successfully');
    return payload;
  } catch (error) {
    console.error('Token decoding failed');
    return null;
  }
}

// Legacy function names for backward compatibility
export const decodeTokenSafe = decodeTokenPayload;
export const verifyYdoToken = decodeTokenPayload;

// Note: Token generation is now only done server-side for security
// The client should never generate tokens - they are created by the edge function
// and sent via email links
export const generateYdoToken = (email: string, province: string): string => {
  console.warn('Client-side token generation is deprecated. Tokens should only be generated server-side.');
  // Return empty string - tokens should come from server
  throw new Error('Token generation is only available server-side for security reasons');
};