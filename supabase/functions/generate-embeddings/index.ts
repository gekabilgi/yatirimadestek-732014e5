import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces for embedding
function chunkText(text: string, chunkSize = 500): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate embedding using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI Embedding API error:', response.status, error);
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filename, content, uploadId } = await req.json();
    
    console.log('Processing document:', filename);
    
    // Chunk the text
    const chunks = chunkText(content);
    console.log(`Created ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    const embeddings: Array<{
      filename: string;
      content: string;
      chunk_index: number;
      embedding: number[];
    }> = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
      const embedding = await generateEmbedding(chunks[i]);
      
      embeddings.push({
        filename,
        content: chunks[i],
        chunk_index: i,
        embedding,
      });
    }

    // Insert into database
    const { error: insertError } = await supabase
      .from('knowledge_base')
      .insert(embeddings);

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    // Update upload status
    if (uploadId) {
      await supabase
        .from('document_uploads')
        .update({
          status: 'completed',
          chunks_count: chunks.length,
        })
        .eq('id', uploadId);
    }

    console.log('Successfully processed document');

    return new Response(
      JSON.stringify({
        success: true,
        chunks_count: chunks.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-embeddings:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
