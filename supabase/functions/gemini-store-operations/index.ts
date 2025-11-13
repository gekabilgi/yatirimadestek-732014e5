import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

    const { operation, storeName, displayName } = await req.json();

    switch (operation) {
      case 'list': {
        // List file search stores
        const response = await fetch(
          `${GEMINI_API_BASE}/fileSearchStores?key=${GEMINI_API_KEY}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${errorText}`);
        }

        const data = await response.json();
        const stores = data.fileSearchStores || [];
        
        const result = stores.map((store: any) => ({
          name: store.name,
          displayName: store.displayName || store.name?.split("/").pop() || "Untitled Store",
        }));

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        if (!displayName) throw new Error("displayName required for create");
        
        const response = await fetch(
          `${GEMINI_API_BASE}/fileSearchStores?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${errorText}`);
        }

        const store = await response.json();

        return new Response(JSON.stringify({ 
          name: store.name, 
          displayName: store.displayName 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!storeName) throw new Error("storeName required for delete");
        
        const response = await fetch(
          `${GEMINI_API_BASE}/fileSearchStores/${storeName}?key=${GEMINI_API_KEY}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${errorText}`);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error('Error in gemini-store-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
