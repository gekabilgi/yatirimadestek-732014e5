
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
  universe_domain: string;
}

async function getAccessToken(credentials: GoogleAnalyticsCredentials): Promise<string> {
  const jwt = await createJWT(credentials);
  
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
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createJWT(credentials: GoogleAnalyticsCredentials): Promise<string> {
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
  const pemKey = credentials.private_key.replace(/\\n/g, '\n');
  const pemContents = pemKey.replace(/-----BEGIN PRIVATE KEY-----\n/, '').replace(/\n-----END PRIVATE KEY-----/, '').replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
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

  return `${signatureInput}.${encodedSignature}`;
}

async function fetchAnalyticsData(accessToken: string, propertyId: string) {
  const baseUrl = 'https://analyticsdata.googleapis.com/v1beta';
  
  try {
    // Get active users (real-time)
    const activeUsersResponse = await fetch(`${baseUrl}/${propertyId}:runRealtimeReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: [{ name: 'activeUsers' }],
      }),
    });

    if (!activeUsersResponse.ok) {
      console.error('Failed to fetch active users:', activeUsersResponse.status, activeUsersResponse.statusText);
    }

    // Get new users (last 7 days)
    const newUsersResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'newUsers' }],
      }),
    });

    // Get sessions (last 7 days)
    const sessionsResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }],
      }),
    });

    // Get page views (last 7 days)
    const pageViewsResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }],
      }),
    });

    // Get engagement rate (last 7 days)
    const engagementResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'engagementRate' }],
      }),
    });

    // Get daily page views for trend (last 7 days)
    const dailyPageViewsResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
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
    });

    // Get top pages
    const topPagesResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
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
    });

    const [
      activeUsersData,
      newUsersData,
      sessionsData,
      pageViewsData,
      engagementData,
      dailyPageViewsData,
      topPagesData
    ] = await Promise.all([
      activeUsersResponse.ok ? activeUsersResponse.json() : null,
      newUsersResponse.ok ? newUsersResponse.json() : null,
      sessionsResponse.ok ? sessionsResponse.json() : null,
      pageViewsResponse.ok ? pageViewsResponse.json() : null,
      engagementResponse.ok ? engagementResponse.json() : null,
      dailyPageViewsResponse.ok ? dailyPageViewsResponse.json() : null,
      topPagesResponse.ok ? topPagesResponse.json() : null,
    ]);

    console.log('GA4 API responses received');

    return {
      activeUsers: activeUsersData?.rows?.[0]?.metricValues?.[0]?.value || '0',
      newUsers: newUsersData?.rows?.[0]?.metricValues?.[0]?.value || '0',
      sessions: sessionsData?.rows?.[0]?.metricValues?.[0]?.value || '0',
      pageViews: pageViewsData?.rows?.[0]?.metricValues?.[0]?.value || '0',
      engagementRate: engagementData?.rows?.[0]?.metricValues?.[0]?.value || '0',
      dailyPageViews: dailyPageViewsData?.rows?.map((row: any) => ({
        date: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value)
      })) || [],
      topPages: topPagesData?.rows?.map((row: any) => ({
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
    const credentialsString = Deno.env.get('GOOGLE_ANALYTICS_CREDENTIALS');
    const propertyId = Deno.env.get('GA_PROPERTY_ID');

    if (!credentialsString || !propertyId) {
      console.error('Missing credentials or property ID');
      throw new Error('Missing Google Analytics credentials or property ID');
    }

    console.log('Parsing GA credentials...');
    
    // Try to parse credentials with better error handling
    let credentials: GoogleAnalyticsCredentials;
    try {
      // Clean up the credentials string - remove any BOM or extra whitespace
      const cleanCredentialsString = credentialsString.trim().replace(/^\uFEFF/, '');
      credentials = JSON.parse(cleanCredentialsString);
    } catch (parseError) {
      console.error('Failed to parse credentials JSON:', parseError);
      console.error('Credentials string length:', credentialsString.length);
      console.error('First 100 chars:', credentialsString.substring(0, 100));
      throw new Error('Invalid Google Analytics credentials format');
    }
    
    console.log('Getting access token...');
    const accessToken = await getAccessToken(credentials);
    
    console.log('Fetching analytics data...');
    const analyticsData = await fetchAnalyticsData(accessToken, propertyId);
    
    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in google-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
