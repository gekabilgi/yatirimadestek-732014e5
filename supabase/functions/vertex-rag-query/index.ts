import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Get OAuth2 access token from GCP Service Account with proper RS256 JWT signing
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
  if (!serviceAccountJson) {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON not configured");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT header and payload
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Base64url encode
  const base64urlEncode = (data: string) => {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key and sign with RS256
  const privateKeyPem = serviceAccount.private_key;
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  // Extract base64 content between header and footer
  const pemLines = privateKeyPem.split('\n');
  const base64Lines = pemLines.filter(line => 
    !line.includes('BEGIN') && !line.includes('END') && line.trim().length > 0
  );
  const pemContents = base64Lines.join('');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureArray = new Uint8Array(signature);
  const signatureBase64url = base64urlEncode(
    String.fromCharCode(...signatureArray)
  );

  const jwt = `${signatureInput}.${signatureBase64url}`;

  // Exchange JWT for access token
  const tokenRequest = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRequest.ok) {
    const errorText = await tokenRequest.text();
    console.error("Token request failed:", tokenRequest.status, errorText);
    throw new Error(`Failed to get access token: ${tokenRequest.status}`);
  }

  const tokenData = await tokenRequest.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { corpusName, messages, topK = 10, vectorDistanceThreshold = 0.7 } = await req.json();
    
    console.log("=== vertex-rag-query request ===");
    console.log("corpusName:", corpusName);
    console.log("messages count:", messages?.length);
    console.log("topK:", topK);
    console.log("vectorDistanceThreshold:", vectorDistanceThreshold);

    if (!corpusName) {
      throw new Error("corpusName is required");
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages must be a non-empty array");
    }

    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== "user") {
      throw new Error("Last message must be from user");
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Extract project ID and location from corpus name
    // Format: projects/{project}/locations/{location}/ragCorpora/{corpus_id}
    const corpusMatch = corpusName.match(/projects\/([^\/]+)\/locations\/([^\/]+)/);
    if (!corpusMatch) {
      throw new Error("Invalid corpus name format");
    }

    const [_, projectId, location] = corpusMatch;
    
    // Call model's generateContent endpoint with RAG retrieval
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;

    console.log("Calling Vertex AI endpoint:", endpoint);
    console.log("Using corpus:", corpusName);

    // Prepare system prompt for Turkish RAG responses
    const systemPrompt = {
      role: "user",
      parts: [{ 
        text: `Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın. 
Kullanıcının sorularını SADECE sağlanan kaynaklardan (RAG) gelen bilgilere dayanarak yanıtla.
Kaynaklarda bilgi yoksa, bunu açıkça belirt.
Her zaman Türkçe yanıt ver ve profesyonel bir dil kullan.` 
      }]
    };

    // Call Vertex AI with RAG retrieval configuration
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          systemPrompt,
          ...messages.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          }))
        ],
        tools: [{
          retrieval: {
            vertexRagStore: {
              ragResources: [{ ragCorpus: corpusName }],
              similarityTopK: topK,
              vectorDistanceThreshold: vectorDistanceThreshold,
            },
          },
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vertex AI API error:", response.status, errorText);
      throw new Error(`Vertex AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Vertex AI response received");

    // Extract text and grounding chunks
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text = parts.map((p: any) => p.text).join("");
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    // Detailed debug logging
    console.log("=== Vertex AI Response Details ===");
    console.log("Text length:", text.length);
    console.log("Grounding chunks count:", groundingChunks.length);
    console.log("First 200 chars:", text.substring(0, 200));
    console.log("Candidate finish reason:", candidate?.finishReason);

    // Check for empty or insufficient response
    if (!text || text.trim().length === 0) {
      console.log("WARNING: Empty response from Vertex AI RAG");
      return new Response(
        JSON.stringify({
          text: "Üzgünüm, sağlanan kaynaklarda bu soruya yanıt verecek bilgi bulunamadı. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin veya daha spesifik detaylar ekleyin.",
          sources: [],
          groundingChunks: [],
          vertexRag: true,
          emptyResponse: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract sources from grounding chunks
    const sources = groundingChunks.map((chunk: any) => ({
      title: chunk.retrievedContext?.title || "Unknown",
      uri: chunk.retrievedContext?.uri || "",
    }));

    return new Response(
      JSON.stringify({
        text,
        sources,
        groundingChunks,
        vertexRag: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("vertex-rag-query error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
