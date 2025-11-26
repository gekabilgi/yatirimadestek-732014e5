import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Authorization header from request
    const authHeader = req.headers.get("Authorization");
    
    // Create Supabase client with auth header
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    const { operation, ...params } = await req.json();

    switch (operation) {
      case "list_stores":
        return await listStores(supabase);
      
      case "create_store":
        return await createStore(supabase, params);
      
      case "delete_store":
        return await deleteStore(supabase, params.storeId);
      
      case "set_active_store":
        return await setActiveStore(supabase, params.storeId);
      
      case "list_documents":
        return await listDocuments(supabase, params.storeId);
      
      case "upload_document":
        return await uploadDocument(supabase, params);
      
      case "delete_document":
        return await deleteDocument(supabase, params.documentId);
      
      case "search":
        return await searchTest(supabase, params);
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function listStores(supabase: any) {
  const { data, error } = await supabase
    .from("custom_rag_stores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ stores: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function createStore(supabase: any, params: any) {
  const { name, displayName, embeddingModel, embeddingDimensions, chunkSize, chunkOverlap } = params;

  const { data, error } = await supabase
    .from("custom_rag_stores")
    .insert({
      name,
      display_name: displayName,
      embedding_model: embeddingModel,
      embedding_dimensions: embeddingDimensions,
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ store: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function deleteStore(supabase: any, storeId: string) {
  const { error } = await supabase
    .from("custom_rag_stores")
    .delete()
    .eq("id", storeId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function setActiveStore(supabase: any, storeId: string) {
  // Deactivate all stores
  await supabase
    .from("custom_rag_stores")
    .update({ is_active: false })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  // Activate selected store
  if (storeId) {
    const { error } = await supabase
      .from("custom_rag_stores")
      .update({ is_active: true })
      .eq("id", storeId);

    if (error) throw error;
  }

  // Update admin_settings
  await supabase
    .from("admin_settings")
    .upsert({
      setting_key: "active_custom_rag_store",
      category: "chatbot",
      setting_value: 0,
      setting_value_text: storeId,
      description: "Active Custom RAG store ID",
    }, { onConflict: "setting_key" });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function listDocuments(supabase: any, storeId: string) {
  const { data, error } = await supabase
    .from("custom_rag_documents")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ documents: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function deleteDocument(supabase: any, documentId: string) {
  const { error } = await supabase
    .from("custom_rag_documents")
    .delete()
    .eq("id", documentId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function uploadDocument(supabase: any, params: any) {
  const { storeId, fileName, content, fileType, fileSize } = params;

  // Sanitize content to remove null bytes and control characters
  const sanitizedContent = sanitizeText(content);

  // Get store config
  const { data: store, error: storeError } = await supabase
    .from("custom_rag_stores")
    .select("*")
    .eq("id", storeId)
    .single();

  if (storeError) throw storeError;

  // Create document record with sanitized content
  const { data: document, error: docError } = await supabase
    .from("custom_rag_documents")
    .insert({
      store_id: storeId,
      name: fileName,
      display_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      original_content: sanitizedContent,
      status: "processing",
    })
    .select()
    .single();

  if (docError) throw docError;

  try {
    // Chunk the sanitized document
    const chunks = chunkText(sanitizedContent, store.chunk_size, store.chunk_overlap);

    // Generate embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      const embedding = await generateEmbedding(
        chunks[i],
        store.embedding_model,
        store.embedding_dimensions
      );
      
      console.log(`Generated embedding with ${embedding.length} dimensions`);

      const { error: chunkError } = await supabase
        .from("custom_rag_chunks")
        .insert({
          document_id: document.id,
          store_id: storeId,
          chunk_index: i,
          content: chunks[i],
          embedding: `[${embedding.join(",")}]`,
          token_count: chunks[i].split(/\s+/).length,
        });

      if (chunkError) {
        console.error(`Chunk ${i} insert error:`, chunkError);
        throw new Error(`Failed to insert chunk ${i}: ${chunkError.message}`);
      }
      
      console.log(`Chunk ${i} inserted successfully`);
    }

    // Update document status
    await supabase
      .from("custom_rag_documents")
      .update({
        status: "active",
        chunks_count: chunks.length,
      })
      .eq("id", document.id);

    return new Response(
      JSON.stringify({ document, chunksCount: chunks.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Update document with error
    await supabase
      .from("custom_rag_documents")
      .update({
        status: "failed",
        error_message: error.message,
      })
      .eq("id", document.id);

    throw error;
  }
}

async function searchTest(supabase: any, params: any) {
  const { storeId, query, matchCount = 10 } = params;

  // Get store config
  const { data: store } = await supabase
    .from("custom_rag_stores")
    .select("*")
    .eq("id", storeId)
    .single();

  if (!store) throw new Error("Store not found");

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(
    query,
    store.embedding_model,
    store.embedding_dimensions
  );

  // Search
  const { data: results, error } = await supabase.rpc("match_custom_rag_chunks", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    p_store_id: storeId,
    match_threshold: 0.3,
    match_count: matchCount,
  });

  if (error) throw error;

  return new Response(
    JSON.stringify({ results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function sanitizeText(text: string): string {
  if (!text) return "";
  
  // Remove null bytes and other problematic control characters
  return text
    .replace(/\u0000/g, "")  // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")  // Remove other control characters
    .trim();
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  
  return chunks;
}

async function generateEmbedding(
  text: string,
  model: string,
  dimensions: number
): Promise<number[]> {
  // Sanitize text as extra safety measure
  const sanitizedText = sanitizeText(text);
  
  if (model === "gemini") {
    const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });
    
    const result = await ai.models.embedContent({
      model: "models/text-embedding-004",
      contents: [{ parts: [{ text: sanitizedText }] }],
      config: {
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: dimensions,
      },
    });
    
    return result.embeddings[0].values;
  } else {
    // OpenAI
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-large",
        input: sanitizedText,
        dimensions: dimensions,
      }),
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  }
}
