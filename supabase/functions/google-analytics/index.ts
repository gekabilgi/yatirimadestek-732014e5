
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
  
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(credentials.private_key.replace(/\\n/g, '\n')),
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
  
  // Get total users (last 30 days)
  const usersResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'totalUsers' }],
    }),
  });

  // Get page views (last 30 days)
  const pageViewsResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'screenPageViews' }],
    }),
  });

  // Get daily page views (last 7 days)
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
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 5,
    }),
  });

  // Get monthly users (last 6 months)
  const monthlyUsersResponse = await fetch(`${baseUrl}/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '6monthsAgo', endDate: 'today' }],
      dimensions: [{ name: 'yearMonth' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
    }),
  });

  const [usersData, pageViewsData, dailyPageViewsData, topPagesData, monthlyUsersData] = await Promise.all([
    usersResponse.json(),
    pageViewsResponse.json(),
    dailyPageViewsResponse.json(),
    topPagesResponse.json(),
    monthlyUsersResponse.json(),
  ]);

  return {
    totalUsers: usersData.rows?.[0]?.metricValues?.[0]?.value || '0',
    totalPageViews: pageViewsData.rows?.[0]?.metricValues?.[0]?.value || '0',
    dailyPageViews: dailyPageViewsData.rows?.map((row: any) => ({
      date: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value)
    })) || [],
    topPages: topPagesData.rows?.map((row: any) => ({
      title: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value)
    })) || [],
    monthlyUsers: monthlyUsersData.rows?.map((row: any) => ({
      month: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value)
    })) || [],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const credentialsString = Deno.env.get('GOOGLE_ANALYTICS_CREDENTIALS');
    const propertyId = Deno.env.get('GA_PROPERTY_ID');

    if (!credentialsString || !propertyId) {
      throw new Error('Missing Google Analytics credentials or property ID');
    }

    const credentials: GoogleAnalyticsCredentials = JSON.parse(credentialsString);
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
