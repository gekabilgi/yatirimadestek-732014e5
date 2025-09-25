import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationData {
  country: string;
  city: string;
  region?: string;
  subdivision?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

interface IPGeolocationResponse {
  country_name: string;
  city: string;
  state_prov: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  time_zone: {
    name: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ip } = await req.json();
    
    if (!ip) {
      return new Response(
        JSON.stringify({ error: 'IP address is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const accountId = Deno.env.get('MAXMIND_ACCOUNT_ID');
    const licenseKey = Deno.env.get('MAXMIND_LICENSE_KEY');

    if (!accountId || !licenseKey) {
      console.error('MaxMind credentials not found, using fallback');
      return new Response(
        JSON.stringify({
          country: 'Turkey',
          city: 'Unknown',
          region: 'Unknown'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Basic Auth header
    const credentials = btoa(`${accountId}:${licenseKey}`);
    
    console.log(`Looking up IP: ${ip}`);
    
    // Call MaxMind GeoIP2 City API
    const response = await fetch(`https://geolite.info/geoip/v2.1/city/${ip}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`MaxMind API error: ${response.status} ${response.statusText}`);
      
      // Fallback to Turkey for Turkish users
      return new Response(
        JSON.stringify({
          country: 'Turkey',
          city: 'Unknown',
          region: 'Unknown'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('MaxMind response:', data);

    // Extract location data from MaxMind response
    let locationData: LocationData = {
      country: data.country?.names?.en || data.country?.names?.tr || 'Turkey',
      city: data.city?.names?.en || data.city?.names?.tr || 'Unknown',
      region: data.subdivisions?.[0]?.names?.en || data.subdivisions?.[0]?.names?.tr,
      subdivision: data.subdivisions?.[0]?.iso_code,
      postal: data.postal?.code,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      timezone: data.location?.time_zone
    };

    console.log('MaxMind processed data:', locationData);

    // If MaxMind returned "Unknown" city, try ipgeolocation.io as fallback
    if (locationData.city === 'Unknown') {
      console.log('City is Unknown, trying ipgeolocation.io fallback...');
      
      const ipgeolocationApiKey = Deno.env.get('IPGEOLOCATION_API_KEY');
      
      if (ipgeolocationApiKey) {
        try {
          const ipgeoResponse = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${ipgeolocationApiKey}&ip=${ip}`);
          
          if (ipgeoResponse.ok) {
            const ipgeoData: IPGeolocationResponse = await ipgeoResponse.json();
            console.log('IPGeolocation.io response:', ipgeoData);
            
            // Update location data with ipgeolocation.io data
            locationData = {
              country: ipgeoData.country_name || locationData.country,
              city: ipgeoData.city || locationData.city,
              region: ipgeoData.state_prov || locationData.region,
              subdivision: locationData.subdivision, // Keep MaxMind subdivision
              postal: ipgeoData.zipcode || locationData.postal,
              latitude: ipgeoData.latitude ? parseFloat(ipgeoData.latitude) : locationData.latitude,
              longitude: ipgeoData.longitude ? parseFloat(ipgeoData.longitude) : locationData.longitude,
              timezone: ipgeoData.time_zone?.name || locationData.timezone
            };
            
            console.log('Updated location data from ipgeolocation.io:', locationData);
          } else {
            console.error(`IPGeolocation.io API error: ${ipgeoResponse.status}`);
          }
        } catch (ipgeoError) {
          console.error('Error calling ipgeolocation.io:', ipgeoError);
        }
      } else {
        console.log('IPGeolocation API key not found, skipping fallback');
      }
    }

    return new Response(
      JSON.stringify(locationData), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in ip-geolocation function:', error);
    
    // Always return a fallback response
    return new Response(
      JSON.stringify({
        country: 'Turkey',
        city: 'Unknown',
        region: 'Unknown'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});