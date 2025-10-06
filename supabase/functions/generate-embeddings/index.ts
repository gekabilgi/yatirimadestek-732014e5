import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Q&A-aware chunking that keeps question-answer pairs together
function chunkQAPairs(text: string): Array<{ content: string; question: string | null }> {
  const chunks: Array<{ content: string; question: string | null }> = [];
  
  // Split by "Soru:" pattern while keeping the delimiter
  const qaPairs = text.split(/(?=Soru:)/i).filter(s => s.trim());
  
  for (const pair of qaPairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    
    // Extract question text for metadata
    const questionMatch = trimmed.match(/Soru:\s*(.+?)(?=Cevap:|$)/is);
    const question = questionMatch ? questionMatch[1].trim() : null;
    
    // If chunk is too large (>2000 chars), split it but try to keep Q&A together
    if (trimmed.length > 2000) {
      const parts = trimmed.match(/[\s\S]{1,2000}(?:\s|$)/g) || [trimmed];
      parts.forEach((part, index) => {
        chunks.push({
          content: part.trim(),
          question: index === 0 ? question : null // Only first chunk gets the question
        });
      });
    } else {
      chunks.push({
        content: trimmed,
        question
      });
    }
  }
  
  return chunks.length > 0 ? chunks : [{ content: text, question: null }];
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
    
    // Chunk the text using Q&A-aware chunking
    const chunks = chunkQAPairs(content);
    console.log(`Created ${chunks.length} Q&A chunks`);

    // Generate embeddings for each chunk
    const embeddings: Array<{
      filename: string;
      content: string;
      chunk_index: number;
      embedding: number[];
      metadata?: any;
    }> = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
      const embedding = await generateEmbedding(chunks[i].content);
      
      const metadata: any = {};
      if (chunks[i].question) {
        metadata.question = chunks[i].question;
      }
      
      embeddings.push({
        filename,
        content: chunks[i].content,
        chunk_index: i,
        embedding,
        ...(Object.keys(metadata).length > 0 && { metadata })
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
