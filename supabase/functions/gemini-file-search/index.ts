import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAiClient(): GoogleGenerativeAI {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(apiKey);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, query, isPreciseMode = false } = await req.json();

    if (!storeName || !query) {
      throw new Error("storeName and query are required");
    }

    const ai = getAiClient();
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    let finalQuery = query;
    if (isPreciseMode) {
      finalQuery = `Based on the provided documents, find the single most relevant document to answer the user's question and provide a precise answer based ONLY on that document. Do not mix information from multiple documents. User question: "${query}"`;
    }

    // Generate content with file search grounding
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalQuery }] }],
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: [storeName],
          },
        },
      ],
    });

    const response = result.response;
    const groundingChunks = response.groundingMetadata?.groundingChunks || [];

    return new Response(
      JSON.stringify({
        text: response.text(),
        groundingChunks,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in gemini-file-search:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
