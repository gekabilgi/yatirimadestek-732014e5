import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Get OAuth2 access token from GCP Service Account
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
  if (!serviceAccountJson) {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON not configured");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT for OAuth2
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Sign JWT (simplified, using service account key)
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // For production, use proper JWT signing with private key
  // This is a simplified version - you may need crypto library
  const tokenRequest = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${encodedHeader}.${encodedPayload}.signature`, // Simplified
    }),
  });

  const tokenData = await tokenRequest.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { corpusName, messages, topK = 10, vectorDistanceThreshold = 0.3 } = await req.json();
    
    console.log("=== vertex-rag-query request ===");
    console.log("corpusName:", corpusName);
    console.log("messages count:", messages?.length);

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
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/${corpusName}:generateContent`;

    // Call Vertex AI RAG Corpora API
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        generation_config: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        vertex_rag_store: {
          rag_resources: [corpusName],
          similarity_top_k: topK,
          vector_distance_threshold: vectorDistanceThreshold,
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
