
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
  
  console.log('Generating token with payload:', payload);
  
  // Use a more reliable encoding method
  const jsonString = JSON.stringify(payload);
  
  try {
    // Use TextEncoder for better cross-platform compatibility
    if (typeof TextEncoder !== 'undefined') {
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonString);
      const base64 = btoa(String.fromCharCode(...data));
      console.log('Token generated using TextEncoder method');
      return base64;
    } else {
      // Fallback for older browsers
      const encoded = btoa(unescape(encodeURIComponent(jsonString)));
      console.log('Token generated using fallback method');
      return encoded;
    }
  } catch (error) {
    console.error('Token generation error:', error);
    // Simple fallback
    return btoa(jsonString);
  }
};

export const verifyYdoToken = (token: string): YdoTokenPayload | null => {
  console.log('=== TOKEN VERIFICATION START ===');
  console.log('Platform info:', {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    isMobile: typeof navigator !== 'undefined' ? /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) : false,
    hasTextDecoder: typeof TextDecoder !== 'undefined',
    tokenLength: token?.length || 0,
    tokenPreview: token?.substring(0, 20) + '...' || 'empty'
  });

  if (!token || token.trim() === '') {
    console.error('Token is empty or null');
    return null;
  }

  try {
    let decodedString: string;
    
    // Try TextDecoder first for better cross-platform support
    if (typeof TextDecoder !== 'undefined') {
      try {
        const binaryString = atob(token);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoder = new TextDecoder('utf-8');
        decodedString = decoder.decode(bytes);
        console.log('Used TextDecoder method for decoding');
      } catch (textDecoderError) {
        console.log('TextDecoder failed, trying fallback:', textDecoderError);
        decodedString = decodeURIComponent(escape(atob(token)));
        console.log('Used fallback decoding method');
      }
    } else {
      // Fallback for browsers without TextDecoder
      try {
        decodedString = decodeURIComponent(escape(atob(token)));
        console.log('Used legacy decoding method');
      } catch (legacyError) {
        console.log('Legacy decoding failed, using simple atob:', legacyError);
        decodedString = atob(token);
      }
    }

    console.log('Decoded string length:', decodedString.length);
    console.log('Decoded string preview:', decodedString.substring(0, 100));
    
    const payload = JSON.parse(decodedString) as YdoTokenPayload;
    console.log('Parsed payload:', {
      email: payload.email,
      province: payload.province,
      exp: payload.exp,
      iat: payload.iat,
      hasAllFields: !!(payload.email && payload.province && payload.exp && payload.iat)
    });
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    console.log('Expiry check:', {
      tokenExp: payload.exp,
      currentTime: currentTime,
      isExpired: payload.exp < currentTime,
      timeUntilExpiry: payload.exp - currentTime
    });
    
    if (payload.exp < currentTime) {
      console.error('Token is expired');
      return null;
    }
    
    // Validate required fields with detailed logging
    const validationResult = {
      hasEmail: !!payload.email,
      hasProvince: !!payload.province,
      emailLength: payload.email?.length || 0,
      provinceLength: payload.province?.length || 0,
      provinceValue: payload.province
    };
    
    console.log('Field validation:', validationResult);
    
    if (!payload.email || !payload.province) {
      console.error('Token missing required fields');
      return null;
    }
    
    console.log('=== TOKEN VERIFICATION SUCCESS ===');
    console.log('Verified token for province:', payload.province);
    
    return payload;
  } catch (error) {
    console.error('=== TOKEN VERIFICATION FAILED ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    return null;
  }
};
