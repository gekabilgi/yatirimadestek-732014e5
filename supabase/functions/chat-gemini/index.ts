import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

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
    const { storeName, messages } = await req.json();
    
    if (!storeName || !messages || !Array.isArray(messages)) {
      throw new Error("storeName and messages array are required");
    }

    const ai = getAiClient();
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
Kullanıcılara yatırım destekleri, teşvik programları ve ilgili konularda yardımcı oluyorsun.
Verilen dökümanlardan yararlanarak doğru ve güncel bilgiler ver.
Türkçe konuş ve profesyonel bir üslup kullan.`,
    });

    // Build conversation history
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Generate content with file search grounding
    const result = await model.generateContent({
      contents,
      tools: [{
        fileSearch: {
          fileSearchStoreNames: [storeName],
        },
      }],
    });

    const response = result.response;
    const groundingChunks = response.groundingMetadata?.groundingChunks || [];
    
    return new Response(
      JSON.stringify({ 
        text: response.text(), 
        groundingChunks,
        sources: groundingChunks.map((chunk: any) => ({
          title: chunk.web?.title || 'Document',
          uri: chunk.web?.uri || '',
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in chat-gemini:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
