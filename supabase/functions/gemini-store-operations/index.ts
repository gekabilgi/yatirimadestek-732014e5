import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, FileState } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getAiClient(): GoogleGenerativeAI {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(apiKey);
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
        // List corpora (vector stores)
        const corpora = await ai.corpora.list();
        const result = corpora.map((corpus: any) => ({
          name: corpus.name,
          displayName: corpus.displayName || corpus.name?.split("/").pop() || "Untitled Store",
        }));

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        if (!displayName) throw new Error("displayName required for create");
        
        const corpus = await ai.corpora.create({ displayName });
        if (!corpus?.name) throw new Error("Failed to create corpus");

        return new Response(JSON.stringify({ name: corpus.name, displayName: corpus.displayName }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!storeName) throw new Error("storeName required for delete");
        
        await ai.corpora.delete(storeName);

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
