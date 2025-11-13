import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getAiClient(): GoogleGenAI {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  Deno.env.set('GOOGLE_GENAI_API_KEY', apiKey);
  return new GoogleGenAI({});
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, messages } = await req.json();
    
    console.log('chat-gemini: Processing request with storeName:', storeName);
    
    if (!storeName || !messages || !Array.isArray(messages)) {
      throw new Error("storeName and messages array are required");
    }

    const ai = getAiClient();

    const systemInstruction = `Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
Kullanıcılara yatırım destekleri, teşvik programları ve ilgili konularda yardımcı oluyorsun.
Verilen dökümanlardan yararlanarak doğru ve güncel bilgiler ver.
Türkçe konuş ve profesyonel bir üslup kullan.`;

    // Build conversation history with system instruction
    const contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      { role: 'model', parts: [{ text: 'Anladım, yatırım teşvikleri konusunda yardımcı olmaya hazırım.' }] },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    ];

    // Generate content with file search grounding
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [storeName],
          },
        }],
      },
    });
    
    // Check if response was blocked
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === 'RECITATION' || finishReason === 'SAFETY') {
      return new Response(
        JSON.stringify({ 
          error: "Üzgünüm, bu soruya güvenli bir şekilde cevap veremiyorum. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin.",
          blocked: true,
          reason: finishReason
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    let textOut = "";
    try {
      textOut = response.text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg?.includes('RECITATION') || msg?.includes('SAFETY')) {
        return new Response(
          JSON.stringify({
            error: "Üzgünüm, bu soruya güvenli bir şekilde cevap veremiyorum. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin.",
            blocked: true,
            reason: 'RECITATION',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw e;
    }

    return new Response(
      JSON.stringify({ 
        text: textOut, 
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
