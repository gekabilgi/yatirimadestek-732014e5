import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log('vertex-rag-query: Received request with messages:', messages?.length || 0);

    // Get API key from environment
    const TESVIKSOR_API_KEY = Deno.env.get('TESVIKSOR_API_KEY');
    if (!TESVIKSOR_API_KEY) {
      console.error('TESVIKSOR_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Teşviksor API (streaming endpoint)
    console.log('Calling Teşviksor API at: https://api.tesviksor.com/api/vertex');
    const response = await fetch('https://api.tesviksor.com/api/vertex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TESVIKSOR_API_KEY,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Teşviksor API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Teşviksor API error: ${response.status}`,
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Read streaming response (text/plain)
    if (!response.body) {
      throw new Error('No response body from Teşviksor API');
    }

    console.log('Reading streaming response from Teşviksor API...');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
    }

    console.log('Stream complete. Total response length:', fullText.length);

    // Parse __METADATA__ separator
    const [messageContent, metadataJson] = fullText.split('__METADATA__');
    
    let sources = [];
    if (metadataJson && metadataJson.trim()) {
      try {
        sources = JSON.parse(metadataJson.trim());
        console.log('Parsed sources from metadata:', sources);
      } catch (e) {
        console.error('Failed to parse __METADATA__ JSON:', e);
      }
    }

    // Return in chat-gemini compatible format
    return new Response(
      JSON.stringify({
        text: messageContent.trim(),
        sources: sources, // [{ title: "9903_Karar.pdf", index: 1 }, ...]
        groundingChunks: [],
        vertexRag: true, // Flag to indicate this came from Vertex RAG
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('vertex-rag-query error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Vertex RAG query failed',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
