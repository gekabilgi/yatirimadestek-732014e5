
import { supabase } from '@/integrations/supabase/client';

export interface YdoTokenPayload {
  email: string;
  province: string;
  exp: number;
  iat: number;
}

// Platform-agnostic Base64 decoder that works on both mobile and desktop
export function decodeTokenSafe(token: string): YdoTokenPayload | null {
  try {
    // Normalize URL-safe Base64 (- → +, _ → /)
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding (=) to make it a multiple of 4
    base64 += '='.repeat((4 - base64.length % 4) % 4);
    
    // Decode to binary string
    const binaryStr = atob(base64);
    
    // Convert to Uint8Array
    const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
    
    // Use TextDecoder for safe UTF-8 decoding
    const jsonStr = new TextDecoder('utf-8').decode(bytes);
    
    // Parse JSON
    const payload = JSON.parse(jsonStr) as YdoTokenPayload;
    
    console.log('✅ Safe token decoding successful:', {
      email: payload.email,
      province: `"${payload.province}"`,
      provinceLength: payload.province?.length,
      exp: payload.exp,
      iat: payload.iat
    });
    
    return payload;
  } catch (error) {
    console.error('❌ Safe token decoding failed:', error);
    return null;
  }
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
    // Use the same safe encoding approach
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonString);
    const binaryStr = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    const encoded = btoa(binaryStr);
    console.log('Token generated successfully');
    return encoded;
  } catch (error) {
    console.error('Token generation error:', error);
    // Ultra-simple fallback
    return btoa(jsonString);
  }
};

// Legacy function for backward compatibility - now uses the safe decoder
export const verifyYdoToken = (token: string): YdoTokenPayload | null => {
  console.log('🔍 TOKEN VERIFICATION START');
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

  // Use the new safe decoder
  const payload = decodeTokenSafe(token);
  
  if (!payload) {
    console.error('❌ Token decoding failed');
    return null;
  }
  
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
};
