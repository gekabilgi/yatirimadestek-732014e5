import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getAiClient(): GoogleGenAI {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, storeName, displayName } = await req.json();
    const ai = getAiClient();

    switch (operation) {
      case 'list': {
        const pager = await ai.fileSearchStores.list();
        const stores: any[] = [];
        for await (const s of pager) stores.push(s);
        
        const result = stores.map(s => ({
          name: s.name,
          displayName: s.displayName || s.name?.split("/").pop() || "Untitled Store",
        }));

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        if (!displayName) throw new Error("displayName required for create");
        
        const store = await ai.fileSearchStores.create({ config: { displayName } });
        if (!store?.name) throw new Error("Failed to create store");

        return new Response(JSON.stringify({ name: store.name, displayName: store.displayName }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!storeName) throw new Error("storeName required for delete");
        
        // @ts-ignore - force parameter not in type definition
        await ai.fileSearchStores.delete({ name: storeName, force: true });

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
