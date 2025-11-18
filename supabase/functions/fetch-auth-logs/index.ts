import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginHistory {
  timestamp: string;
  ip_address: string;
  user_agent: string;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { limit = 10 } = await req.json();

    // Create admin client to query auth logs
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Query auth logs from analytics database
    const { data: authLogs, error: logsError } = await supabaseAdmin.rpc(
      'query_auth_logs',
      {
        user_id_filter: user.id,
        limit_count: limit,
      }
    );

    if (logsError) {
      console.error('Error fetching auth logs:', logsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch login history', details: logsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and format login history
    const loginHistory: LoginHistory[] = (authLogs || [])
      .map((log: any) => {
        try {
          const eventMsg = JSON.parse(log.event_message);
          return {
            timestamp: log.timestamp,
            ip_address: eventMsg.remote_addr || 'Unknown',
            user_agent: eventMsg.referer || 'Unknown',
            status: eventMsg.status === 200 ? 'Success' : 'Failed',
          };
        } catch (e) {
          console.error('Error parsing log:', e);
          return null;
        }
      })
      .filter((item: any) => item !== null);

    return new Response(JSON.stringify({ data: loginHistory }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-auth-logs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
