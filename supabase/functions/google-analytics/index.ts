
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
    
    console.log('Processing private key for JWT signing...');
    const pemKey = credentials.private_key;
    
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`JWT creation failed: ${errorMessage}`);
  }
}

async function fetchAnalyticsData(accessToken: string, propertyId: string) {
  const baseUrl = 'https://analyticsdata.googleapis.com/v1beta';
  
  try {
    console.log('Fetching analytics data for property:', propertyId);
    
    // Test basic access first with a simple query
    console.log('Testing basic API access...');
    const testResponse = await fetch(`${baseUrl}/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }],
      }),
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Test API request failed:', testResponse.status, errorText);
      
      if (testResponse.status === 403) {
        throw new Error(`Permission denied: The service account '${accessToken.split('.')[1] ? 'configured' : 'invalid'}' does not have access to GA4 property ${propertyId}. Please add the service account email as a user in your Google Analytics property settings.`);
      }
      
      throw new Error(`GA4 API test failed: ${testResponse.status} - ${errorText}`);
    }

    console.log('Basic API access successful, fetching full analytics data...');
    
    const requests = [
      // Active users (using standard report instead of realtime)
      fetch(`${baseUrl}/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: 'today', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
        }),
      }),
      
      // New users (last 7 days)
      fetch(`${baseUrl}/properties/${propertyId}:runReport`, {
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
      fetch(`${baseUrl}/properties/${propertyId}:runReport`, {
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
      fetch(`${baseUrl}/properties/${propertyId}:runReport`, {
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
      
      // Daily page views for trend (last 7 days)
      fetch(`${baseUrl}/properties/${propertyId}:runReport`, {
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
      
      // Top countries by users (last 7 days)
      fetch(`${baseUrl}/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 20,
        }),
      }),
      
      // Engagement metrics (engagementRate, averageSessionDuration, bounceRate)
      fetch(`${baseUrl}/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' }
          ],
        }),
      }),
    ];

    const responses = await Promise.all(requests);
    
    const results = await Promise.all(
      responses.map(async (response, index) => {
        const requestNames = ['activeUsers', 'newUsers', 'sessions', 'pageViews', 'dailyPageViews', 'topCountries', 'engagementMetrics'];
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch ${requestNames[index]}:`, response.status, errorText);
          return null;
        }
        return response.json();
      })
    );

    console.log('Analytics API requests completed successfully');

    // Process country data
    const topCountries = results[5]?.rows?.map((row: any) => ({
      country: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value)
    })) || [];

    console.log('Country data retrieved:', topCountries);

    // Process engagement metrics
    const engagementData = results[6]?.rows?.[0]?.metricValues || [];
    const rawEngagementRate = parseFloat(engagementData[0]?.value || '0');
    const rawAvgSessionDuration = parseFloat(engagementData[1]?.value || '0');
    const rawBounceRate = parseFloat(engagementData[2]?.value || '0');

    // Format engagement rate as percentage (GA4 returns it as decimal, e.g., 0.75 = 75%)
    const engagementRate = (rawEngagementRate * 100).toFixed(1);
    // Format average session duration as minutes and seconds
    const avgSessionMinutes = Math.floor(rawAvgSessionDuration / 60);
    const avgSessionSeconds = Math.round(rawAvgSessionDuration % 60);
    const averageSessionDuration = `${avgSessionMinutes}:${avgSessionSeconds.toString().padStart(2, '0')}`;
    // Format bounce rate as percentage
    const bounceRate = (rawBounceRate * 100).toFixed(1);

    console.log('Engagement metrics:', { engagementRate, averageSessionDuration, bounceRate });

    return {
      activeUsers: results[0]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      newUsers: results[1]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      sessions: results[2]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      pageViews: results[3]?.rows?.[0]?.metricValues?.[0]?.value || '0',
      engagementRate: engagementRate,
      averageSessionDuration: averageSessionDuration,
      bounceRate: bounceRate,
      dailyPageViews: results[4]?.rows?.map((row: any) => ({
        date: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value)
      })) || [],
      topCountries: topCountries,
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
    
    let credentials: GoogleAnalyticsCredentials;
    try {
      credentials = JSON.parse(credentialsString);
      
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
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Invalid JSON format in GOOGLE_ANALYTICS_CREDENTIALS: ${errorMessage}`);
    }
    
    console.log('Getting access token...');
    const accessToken = await getAccessToken(credentials);
    
    if (isHealthCheck) {
      console.log('Health check passed - credentials are valid');
      return new Response(JSON.stringify({ 
        status: 'ready', 
        message: 'Google Analytics credentials are valid and access token obtained successfully',
        propertyId: propertyId,
        serviceAccount: credentials.client_email,
        instructions: `If you see permission errors, please add ${credentials.client_email} as a user to your Google Analytics property.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Fetching analytics data...');
    const analyticsData = await fetchAnalyticsData(accessToken, propertyId);
    
    console.log('Successfully retrieved analytics data');
    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in google-analytics function:', error);
    
    let userMessage = 'Failed to fetch Google Analytics data';
    let statusCode = 500;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Permission denied') || errorMessage.includes('PERMISSION_DENIED')) {
      userMessage = `Access denied to Google Analytics property. Please add the service account email as a user in your GA4 property settings with 'Viewer' permissions.`;
      statusCode = 403;
    } else if (errorMessage.includes('credentials')) {
      userMessage = 'Google Analytics credentials are invalid or incorrectly formatted';
      statusCode = 401;
    } else if (errorMessage.includes('property')) {
      userMessage = 'Google Analytics property ID is invalid or not accessible';
      statusCode = 403;
    } else if (errorMessage.includes('access token')) {
      userMessage = 'Failed to authenticate with Google Analytics API';
      statusCode = 401;
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        details: errorMessage,
        timestamp: new Date().toISOString(),
        action: statusCode === 403 ? 'Add service account to GA4 property as Viewer' : 'Check credentials and configuration'
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
