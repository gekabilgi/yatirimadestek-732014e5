import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action } = await req.json();

    if (!token) {
      console.error('No reCAPTCHA token provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reCAPTCHA token with Google
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });

    const verifyData = await verifyResponse.json();
    
    console.log('reCAPTCHA verification result:', {
      success: verifyData.success,
      score: verifyData.score,
      action: verifyData.action,
      expectedAction: action,
      hostname: verifyData.hostname,
      errorCodes: verifyData['error-codes'],
    });

    // Check if verification was successful
    if (!verifyData.success) {
      console.error('reCAPTCHA verification failed:', verifyData['error-codes']);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA verification failed',
          errorCodes: verifyData['error-codes']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check score (0.0 = likely bot, 1.0 = likely human)
    const score = verifyData.score || 0;
    const threshold = 0.5; // Recommended threshold

    if (score < threshold) {
      console.warn(`Low reCAPTCHA score: ${score} (threshold: ${threshold})`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Suspicious activity detected',
          score: score
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally verify the action matches
    if (action && verifyData.action && verifyData.action !== action) {
      console.warn(`Action mismatch: expected ${action}, got ${verifyData.action}`);
      // We log but don't fail - some implementations might not send action
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: score,
        action: verifyData.action,
        hostname: verifyData.hostname
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-recaptcha function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
