
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleAnalyticsCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

async function getAccessToken(credentials: GoogleAnalyticsCredentials): Promise<string> {
  try {
    console.log('Creating JWT for service account:', credentials.client_email);
    const jwt = await createJWT(credentials);
    
    console.log('Requesting access token from Google OAuth2...');
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OAuth2 token request failed:', response.status, errorText);
      throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully obtained access token');
    return data.access_token;
  } catch (error) {
    console.error('Error in getAccessToken:', error);
    throw error;
  }
}

async function createJWT(credentials: GoogleAnalyticsCredentials): Promise<string> {
  try {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    // Convert PEM private key to binary format
    console.log('Processing private key for JWT signing...');
    const pemKey = credentials.private_key.replace(/\\n/g, '\n');
    
    if (!pemKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format - missing PEM headers');
    }
    
    const pemContents = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----\n?/, '')
      .replace(/\n?-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');
    
    let binaryKey;
    try {
      binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    } catch (error) {
      throw new Error('Failed to decode private key base64 content');
    }
    
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(signatureInput)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    console.log('JWT created successfully');
    return `${signatureInput}.${encodedSignature}`;
  } catch (error) {
    console.error('Error creating JWT:', error);
    throw new Error(`JWT creation failed: ${error.message}`);
  }
}

async function fetchAnalyticsData(accessToken: string, propertyId: string) {
  const baseUrl = 'https://analyticsdata.googleapis.com/v1beta';
  
  try {
    console.log('Fetching analytics data for property:', propertyId);
    
    // Prepare all API requests
    const requests = [
      // Active users (real-time)
      fetch(`${baseUrl}/${propertyId}:runRealtimeReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: [{ name: 'activeUsers' }],
        }),
      }),
      
      // New users (last 7 days)
      fetch(`${baseUrl}/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'newUsers' }],
        }),
      }),
      
      // Sessions (last 7 days)
      fetch(`${baseUrl}/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'sessions' }],
        }),
      }),
      
      // Page views (last 7 days)
      fetch(`${baseUrl}/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'screenPageViews' }],
        }),
      }),
      
      // Engagement rate (last 7 days)
      fetch(`${baseUrl}/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'engagementRate' }],
        }),
      }),
      
      // Daily page views for trend (last 7 days)
      fetch(`${baseUrl}/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        }),
      }),
      
      // Top pages
      fetch(`${baseUrl}/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pageTitle' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 5,
        }),
      }),
    ];

    // Execute all requests in parallel
    const responses = await Promise.all(requests);
    
    // Check each response and log errors
    const results = await Promise.all(
      responses.map(async (response, index) => {
        const requestNames = ['activeUsers', 'newUsers', 'sessions', 'pageViews', 'engagementRate', 'dailyPageViews', 'topPages'];
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch ${requestNames[index]}:`, response.status, errorText);
          return null;
        }
        return response.json();
      })
    );

    console.log('Analytics API requests completed');

    return {
      activeUsers: results[0]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      newUsers: results[1]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      sessions: results[2]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      pageViews: results[3]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      engagementRate: results[4]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      dailyPageViews: results[5]?.rows?.map((row: any) => ({
        date: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value)
      })) || [],
      topPages: results[6]?.rows?.map((row: any) => ({
        title: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value)
      })) || [],
    };
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isHealthCheck = url.searchParams.get('health') === 'true';

    // Get environment variables
    const credentialsString = Deno.env.get('GOOGLE_ANALYTICS_CREDENTIALS');
    const propertyId = Deno.env.get('GA_PROPERTY_ID');

    if (!credentialsString) {
      console.error('GOOGLE_ANALYTICS_CREDENTIALS environment variable is not set');
      throw new Error('Google Analytics credentials not configured');
    }

    if (!propertyId) {
      console.error('GA_PROPERTY_ID environment variable is not set');
      throw new Error('Google Analytics property ID not configured');
    }

    console.log('Environment variables found - parsing credentials...');
    console.log('Credentials string length:', credentialsString.length);
    console.log('Property ID:', propertyId);
    
    // Parse credentials with comprehensive error handling
    let credentials: GoogleAnalyticsCredentials;
    try {
      // Clean up the credentials string - remove any BOM, extra whitespace, or control characters
      const cleanCredentialsString = credentialsString
        .trim()
        .replace(/^\uFEFF/, '') // Remove BOM
        .replace(/[\r\n\t]/g, ''); // Remove control characters that might break JSON parsing
      
      console.log('Attempting to parse credentials JSON...');
      credentials = JSON.parse(cleanCredentialsString);
      
      // Validate required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
      const missingFields = requiredFields.filter(field => !credentials[field as keyof GoogleAnalyticsCredentials]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required credential fields: ${missingFields.join(', ')}`);
      }
      
      if (credentials.type !== 'service_account') {
        throw new Error(`Invalid credential type: ${credentials.type}. Expected: service_account`);
      }
      
      console.log('Credentials parsed successfully for service account:', credentials.client_email);
      
    } catch (parseError) {
      console.error('Failed to parse credentials JSON:', parseError);
      console.error('Raw credentials preview (first 100 chars):', credentialsString.substring(0, 100));
      
      // Provide specific error messages based on the type of parsing error
      if (parseError instanceof SyntaxError) {
        throw new Error(`Invalid JSON format in GOOGLE_ANALYTICS_CREDENTIALS: ${parseError.message}. Please ensure the environment variable contains a valid JSON service account key.`);
      } else {
        throw new Error(`Credential validation failed: ${parseError.message}`);
      }
    }
    
    // Get access token
    console.log('Getting access token...');
    const accessToken = await getAccessToken(credentials);
    
    // Health check mode - just verify credentials work
    if (isHealthCheck) {
      console.log('Health check passed - credentials are valid');
      return new Response(JSON.stringify({ 
        status: 'ready', 
        message: 'Google Analytics credentials are valid and access token obtained successfully',
        propertyId: propertyId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Fetch analytics data
    console.log('Fetching analytics data...');
    const analyticsData = await fetchAnalyticsData(accessToken, propertyId);
    
    console.log('Successfully retrieved analytics data');
    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in google-analytics function:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to fetch Google Analytics data';
    let statusCode = 500;
    
    if (error.message.includes('credentials')) {
      userMessage = 'Google Analytics credentials are invalid or incorrectly formatted';
      statusCode = 401;
    } else if (error.message.includes('property')) {
      userMessage = 'Google Analytics property ID is invalid or not accessible';
      statusCode = 403;
    } else if (error.message.includes('access token')) {
      userMessage = 'Failed to authenticate with Google Analytics API';
      statusCode = 401;
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
