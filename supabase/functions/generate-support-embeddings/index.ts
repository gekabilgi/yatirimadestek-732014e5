import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateEmbedding(text: string): Promise<number[]> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("Missing OPENAI_API_KEY");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { programId, generateAll } = await req.json();

    if (generateAll) {
      // Generate embeddings for all programs without embeddings
      const { data: programs, error: fetchError } = await supabase
        .from("support_programs")
        .select(`
          id,
          title,
          description,
          eligibility_criteria,
          institutions!inner(name)
        `)
        .is("embedding", null);

      if (fetchError) throw fetchError;

      console.log(`Found ${programs?.length || 0} programs without embeddings`);

      let successCount = 0;
      let errorCount = 0;

      for (const program of programs || []) {
        try {
          // Combine relevant fields for embedding
          const textToEmbed = [
            program.title,
            program.description,
            program.eligibility_criteria,
            (program.institutions as any)?.name,
          ]
            .filter(Boolean)
            .join(" | ");

          console.log(`Generating embedding for: ${program.title}`);
          const embedding = await generateEmbedding(textToEmbed);

          // Update the program with embedding
          const { error: updateError } = await supabase
            .from("support_programs")
            .update({ embedding: `[${embedding.join(",")}]` })
            .eq("id", program.id);

          if (updateError) {
            console.error(`Error updating ${program.id}:`, updateError);
            errorCount++;
          } else {
            successCount++;
          }

          // Rate limiting - wait 200ms between requests
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`Error processing ${program.id}:`, err);
          errorCount++;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Generated embeddings for ${successCount} programs, ${errorCount} errors`,
          total: programs?.length || 0,
          successCount,
          errorCount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate embedding for a single program
    if (programId) {
      const { data: program, error: fetchError } = await supabase
        .from("support_programs")
        .select(`
          id,
          title,
          description,
          eligibility_criteria,
          institutions!inner(name)
        `)
        .eq("id", programId)
        .single();

      if (fetchError) throw fetchError;
      if (!program) throw new Error("Program not found");

      const textToEmbed = [
        program.title,
        program.description,
        program.eligibility_criteria,
        (program.institutions as any)?.name,
      ]
        .filter(Boolean)
        .join(" | ");

      const embedding = await generateEmbedding(textToEmbed);

      const { error: updateError } = await supabase
        .from("support_programs")
        .update({ embedding: `[${embedding.join(",")}]` })
        .eq("id", programId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          message: `Generated embedding for: ${program.title}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Please provide programId or set generateAll: true" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
