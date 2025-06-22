
import { supabase } from '@/integrations/supabase/client';

export interface YdoTokenPayload {
  email: string;
  province: string;
  exp: number;
  iat: number;
}

// Enhanced mobile-compatible token generation
export const generateYdoToken = (email: string, province: string): string => {
  const payload: YdoTokenPayload = {
    email,
    province,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  };
  
  console.log('Generating token with payload:', payload);
  
  const jsonString = JSON.stringify(payload);
  
  try {
    // Mobile-first approach - use simple base64 encoding
    const encoded = btoa(unescape(encodeURIComponent(jsonString)));
    console.log('Token generated successfully');
    return encoded;
  } catch (error) {
    console.error('Token generation error:', error);
    // Ultra-simple fallback
    return btoa(jsonString);
  }
};

export const verifyYdoToken = (token: string): YdoTokenPayload | null => {
  console.log('🔍 MOBILE TOKEN VERIFICATION START');
  console.log('🌍 Environment:', {
    userAgent: navigator.userAgent,
    isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
    tokenExists: !!token,
    tokenLength: token?.length || 0
  });

  if (!token || token.trim() === '') {
    console.error('❌ Token is empty');
    return null;
  }

  try {
    // Mobile-optimized decoding strategy
    let decodedString: string;
    
    console.log('📱 Attempting mobile-compatible decoding...');
    
    try {
      // Primary mobile-compatible method
      decodedString = decodeURIComponent(escape(atob(token)));
      console.log('✅ Mobile decoding successful');
    } catch (mobileError) {
      console.log('⚠️ Mobile decoding failed, trying simple atob:', mobileError);
      try {
        decodedString = atob(token);
        console.log('✅ Simple atob successful');
      } catch (simpleError) {
        console.error('❌ All decoding methods failed:', simpleError);
        return null;
      }
    }

    console.log('📋 Decoded string preview:', decodedString.substring(0, 50) + '...');
    
    const payload = JSON.parse(decodedString) as YdoTokenPayload;
    
    console.log('🎯 PARSED PAYLOAD:', {
      email: payload.email,
      province: `"${payload.province}"`,
      provinceLength: payload.province?.length,
      provinceCharCodes: payload.province ? Array.from(payload.province).map(c => c.charCodeAt(0)) : [],
      exp: payload.exp,
      iat: payload.iat
    });
    
    // Check expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      console.error('❌ Token expired');
      return null;
    }
    
    // Validate required fields
    if (!payload.email || !payload.province) {
      console.error('❌ Missing required fields');
      return null;
    }
    
    console.log('✅ TOKEN VERIFICATION SUCCESS');
    return payload;
    
  } catch (error) {
    console.error('❌ TOKEN VERIFICATION FAILED:', error);
    return null;
  }
};
