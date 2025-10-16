import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Starting to process missing embeddings...');

    // Get all rows without embeddings
    const { data: missingEmbeddings, error: fetchError } = await supabase
      .from('cb_knowledge_base')
      .select('id, question, answer')
      .is('embedding', null);

    if (fetchError) {
      console.error('Error fetching rows:', fetchError);
      throw fetchError;
    }

    if (!missingEmbeddings || missingEmbeddings.length === 0) {
      console.log('No rows with missing embeddings found');
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No rows with missing embeddings found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${missingEmbeddings.length} rows with missing embeddings`);

    let processed = 0;
    let failed = 0;
    const errors: Array<{ id: string; filename: string; error: string }> = [];

    // Process each row
    for (const row of missingEmbeddings) {
      try {
        console.log(`Processing row ${row.id} (${row.question.substring(0, 50)})...`);
        
        // Combine question and answer for embedding
        const textToEmbed = `${row.question}\n${row.answer}`;
        
        // Generate embedding
        const embedding = await generateEmbedding(textToEmbed);
        
        // Update the row with the embedding
        const { error: updateError } = await supabase
          .from('cb_knowledge_base')
          .update({ 
            embedding,
            updated_at: new Date().toISOString()
          })
          .eq('id', row.id);

        if (updateError) {
          console.error(`Error updating row ${row.id}:`, updateError);
          failed++;
          errors.push({
            id: row.id,
            filename: row.question.substring(0, 50),
            error: updateError.message
          });
        } else {
          console.log(`Successfully processed row ${row.id}`);
          processed++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing row ${row.id}:`, error);
        failed++;
        errors.push({
          id: row.id,
          filename: row.question.substring(0, 50),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Processing complete. Processed: ${processed}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: missingEmbeddings.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-missing-embeddings:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
