
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
  // Make sure encoding is consistent across platforms
  const jsonString = JSON.stringify(payload);
  console.log('Token payload before encoding:', jsonString);
  
  try {
    const encoded = btoa(unescape(encodeURIComponent(jsonString)));
    console.log('Generated token successfully');
    return encoded;
  } catch (error) {
    console.error('Token generation error:', error);
    // Fallback encoding for problematic characters
    return btoa(jsonString);
  }
};

export const verifyYdoToken = (token: string): YdoTokenPayload | null => {
  console.log('Verifying token on platform:', {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    isMobile: typeof navigator !== 'undefined' ? /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) : false,
    tokenLength: token?.length || 0,
    tokenStart: token?.substring(0, 10) || 'empty'
  });

  if (!token || token.trim() === '') {
    console.error('Token is empty or null');
    return null;
  }

  try {
    // Try multiple decoding approaches for better cross-platform compatibility
    let decodedString;
    
    try {
      // Primary decoding method
      decodedString = decodeURIComponent(escape(atob(token)));
      console.log('Used primary decoding method');
    } catch (primaryError) {
      console.log('Primary decoding failed, trying fallback:', primaryError);
      try {
        // Fallback decoding method
        decodedString = atob(token);
        console.log('Used fallback decoding method');
      } catch (fallbackError) {
        console.error('Both decoding methods failed:', fallbackError);
        return null;
      }
    }

    console.log('Decoded token string:', decodedString);
    
    const payload = JSON.parse(decodedString) as YdoTokenPayload;
    console.log('Parsed token payload:', payload);
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    console.log('Token expiry check:', {
      tokenExp: payload.exp,
      currentTime: currentTime,
      isExpired: payload.exp < currentTime,
      timeUntilExpiry: payload.exp - currentTime
    });
    
    if (payload.exp < currentTime) {
      console.error('Token is expired');
      return null;
    }
    
    // Validate required fields
    if (!payload.email || !payload.province) {
      console.error('Token missing required fields:', {
        hasEmail: !!payload.email,
        hasProvince: !!payload.province
      });
      return null;
    }
    
    console.log('Token verified successfully for:', {
      email: payload.email,
      province: payload.province
    });
    
    return payload;
  } catch (error) {
    console.error('Token verification failed with error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return null;
  }
};
