import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface KnowledgeBaseRecord {
  id: string;
  filename: string;
  content: string;
  embedding: number[];
  chunk_index: number;
}

interface QuestionGroup {
  canonical_question: string;
  canonical_answer: string;
  variants: string[];
  source_document: string;
  confidence_score: number;
}

async function groupSimilarQuestions(
  records: KnowledgeBaseRecord[],
  threshold: number = 0.95
): Promise<QuestionGroup[]> {
  console.log(`Grouping ${records.length} records with threshold ${threshold}...`);
  
  const groups: QuestionGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    if (processed.has(records[i].id)) continue;

    const group: QuestionGroup = {
      canonical_question: records[i].content.split('\n')[0] || records[i].content,
      canonical_answer: records[i].content,
      variants: [],
      source_document: records[i].filename,
      confidence_score: 1.0,
    };

    processed.add(records[i].id);

    // Find similar records using cosine similarity
    for (let j = i + 1; j < records.length; j++) {
      if (processed.has(records[j].id)) continue;

      const similarity = cosineSimilarity(
        records[i].embedding,
        records[j].embedding
      );

      if (similarity > threshold) {
        const question = records[j].content.split('\n')[0] || records[j].content;
        group.variants.push(question);
        processed.add(records[j].id);
        
        console.log(`  Grouped: "${question}" (similarity: ${similarity.toFixed(3)})`);
      }
    }

    groups.push(group);
  }

  console.log(`Created ${groups.length} groups from ${records.length} records`);
  return groups;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const embeddingResponse = await fetch(
    "https://api.openai.com/v1/embeddings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text.substring(0, 8000), // Limit to avoid token limits
        model: "text-embedding-3-small",
      }),
    }
  );

  if (!embeddingResponse.ok) {
    throw new Error(`OpenAI embedding failed: ${embeddingResponse.status}`);
  }

  const embeddingData = await embeddingResponse.json();
  return embeddingData.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dryRun = true, similarityThreshold = 0.95, batchSize = 50 } = await req.json().catch(() => ({}));

    console.log("Starting migration with params:", { dryRun, similarityThreshold, batchSize });

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all records from knowledge_base
    console.log("Fetching records from knowledge_base...");
    const { data: records, error: fetchError } = await supabase
      .from("knowledge_base")
      .select("id, filename, content, embedding, chunk_index")
      .order("filename", { ascending: true })
      .order("chunk_index", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch knowledge base: ${fetchError.message}`);
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No records to migrate",
          stats: { total: 0, grouped: 0, saved: 0 },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${records.length} records to process`);

    // Group similar questions
    const groups = await groupSimilarQuestions(
      records as KnowledgeBaseRecord[],
      similarityThreshold
    );

    console.log(`Reduction: ${records.length} -> ${groups.length} (${((1 - groups.length / records.length) * 100).toFixed(1)}% reduction)`);

    if (dryRun) {
      // Return preview without saving
      const preview = groups.slice(0, 10).map(g => ({
        canonical_question: g.canonical_question.substring(0, 100) + "...",
        variant_count: g.variants.length,
        source: g.source_document,
      }));

      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          stats: {
            totalRecords: records.length,
            groupedRecords: groups.length,
            reductionPercent: ((1 - groups.length / records.length) * 100).toFixed(1),
            estimatedSavings: {
              embeddings: records.length - groups.length,
              costSavings: `~$${((records.length - groups.length) * 0.00002).toFixed(4)}/upload`,
            },
          },
          preview,
          message: "Dry run completed. Set dryRun=false to save results.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Save to question_variants table
    console.log("Saving to question_variants...");
    let saved = 0;
    let failed = 0;

    for (let i = 0; i < groups.length; i += batchSize) {
      const batch = groups.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(groups.length / batchSize)}...`);

      for (const group of batch) {
        try {
          // Generate embedding for canonical question
          const embedding = await generateEmbedding(group.canonical_question);

          const { error: insertError } = await supabase
            .from("question_variants")
            .insert({
              canonical_question: group.canonical_question,
              canonical_answer: group.canonical_answer,
              variants: group.variants,
              embedding,
              source_document: group.source_document,
              confidence_score: group.confidence_score,
              metadata: {
                migrated_at: new Date().toISOString(),
                original_count: group.variants.length + 1,
              },
            });

          if (insertError) {
            console.error("Insert error:", insertError);
            failed++;
          } else {
            saved++;
          }
        } catch (error) {
          console.error("Error processing group:", error);
          failed++;
        }
      }

      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        stats: {
          totalRecords: records.length,
          groupedRecords: groups.length,
          saved,
          failed,
          reductionPercent: ((1 - groups.length / records.length) * 100).toFixed(1),
        },
        message: `Migration completed. ${saved} groups saved, ${failed} failed.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in migrate-existing-knowledge:", error);
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
