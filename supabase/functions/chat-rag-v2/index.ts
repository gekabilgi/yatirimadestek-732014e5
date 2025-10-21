import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INFO_SENTENCE =
  " Daha fazla bilgi ve detaylı destek için Yatırım Destek Ofisi Uzmanımız ile iletişime geçebilirsiniz.";
const BADGE_TAG = "[badge: Destek Almak İçin|https://tesviksor.com/qna]";

function shouldAppendBadge(answer: string): boolean {
  const lowerAnswer = answer.toLowerCase();
  return (
    lowerAnswer.includes("başvuru") ||
    lowerAnswer.includes("teşvik") ||
    lowerAnswer.includes("destek") ||
    lowerAnswer.includes("yatırım")
  );
}

function appendInfoAndBadge(answer: string): string {
  return answer + INFO_SENTENCE + " " + BADGE_TAG;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  console.log("Generating embedding for query...");
  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
    }),
  });

  if (!embeddingResponse.ok) {
    const errorText = await embeddingResponse.text();
    console.error("OpenAI embedding error:", errorText);
    throw new Error(`OpenAI embedding failed: ${embeddingResponse.status}`);
  }

  const embeddingData = await embeddingResponse.json();
  return embeddingData.data[0].embedding;
}

async function generateResponse(context: string, question: string, matchedQuestions: string[]): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const systemPrompt = `Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın. Görevin, kullanıcıların sorularına verilen bilgi bankası içeriğine dayanarak doğru ve yardımcı yanıtlar vermektir.

Önemli kurallar:
1. SADECE verilen bilgi bankası içeriğini kullan
2. Bilmediğin bir şey sorulursa "Bu konuda elimde yeterli bilgi yok" de
3. Yanıtlarını profesyonel ama samimi bir dille yaz
4. Yanıtlarında markdown formatını kullan (başlıklar, listeler, vurgular)
5. Gerekirse adım adım açıkla
6. İlgili yasal düzenlemelere atıfta bulun
7. Eğer yanıt bir ilin "Yerel Kalkınma Hamlesi Yatırım Konuları" hakkındaysa, cevabın sonuna aşağıdaki işareti *aynen* ekle:
   Başvuru ve detaylı bilgi için [badge: Yerel Kalkınma Hamlesi|https://yerelkalkinmahamlesi.sanayi.gov.tr]
8. Eğer yanıt "HIT-30", "HİT-30", "hit30", "hit-30" hakkındaysa, cevabın sonuna aşağıdaki işareti *aynen* ekle:
   Başvuru ve detaylı bilgi için [badge: HIT-30|https://hit30.sanayi.gov.tr]
   Bu işareti metin içinde HTML'e dönüştürmeye çalışma; sadece bu işareti yaz`;

  const userPrompt = `Soru: ${question}

${matchedQuestions.length > 0 ? `Benzer sorular: ${matchedQuestions.join(", ")}\n\n` : ""}
Bilgi Bankası İçeriği:
${context}

Lütfen yukarıdaki bilgilere dayanarak soruyu yanıtla.`;

  console.log("Generating AI response with Lovable AI...");
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable AI error:", errorText);
    throw new Error(`Lovable AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Question is required and must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("RAG-V2: Processing question:", question);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question);

    // Search for similar questions using the new question_variants table
    console.log("Searching question_variants with hybrid search...");
    const { data: matches, error: matchError } = await supabase.rpc("hybrid_match_question_variants", {
      query_text: question,
      query_embedding: queryEmbedding,
      match_threshold: 0.04,
      match_count: 10,
    });

    if (matchError) {
      console.error("Error matching question variants:", matchError);
      throw new Error(`Failed to match question variants: ${matchError.message}`);
    }

    console.log(`Found ${matches?.length || 0} matching question variants`);

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({
          answer:
            "Üzgünüm, bu sorunuzla ilgili bilgi bankamda yeterli bilgi bulamadım. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin veya Yatırım Destek Ofisi Uzmanımız ile iletişime geçin.",
          sources: [],
          debug: {
            matchCount: 0,
            systemVersion: "v2",
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Extract matched questions including variants
    const matchedQuestions: string[] = [];
    matches.forEach((match) => {
      matchedQuestions.push(match.canonical_question);
      if (match.variants && match.variants.length > 0) {
        matchedQuestions.push(...match.variants);
      }
    });

    // Build context from matches
    const context = matches
      .map((match, index) => {
        const variants = match.variants?.length > 0 ? `\nAlternatif sorular: ${match.variants.join(", ")}` : "";
        return `[${index + 1}] Soru: ${match.canonical_question}${variants}\nCevap: ${match.canonical_answer}\nSimilarity: ${match.similarity.toFixed(3)} (${match.match_type})`;
      })
      .join("\n\n---\n\n");

    console.log("Context built from", matches.length, "variant groups");

    // Generate AI response
    const answer = await generateResponse(
      context,
      question,
      matchedQuestions.slice(0, 5), // Top 5 similar questions
    );

    // Append badge if relevant
    const finalAnswer = shouldAppendBadge(answer) ? appendInfoAndBadge(answer) : answer;

    // Prepare sources
    const sources = matches.map((match) => ({
      question: match.canonical_question,
      variants: match.variants || [],
      similarity: match.similarity,
      matchType: match.match_type,
      source: match.source_document || "Unknown",
    }));

    return new Response(
      JSON.stringify({
        answer: finalAnswer,
        sources,
      debug: {
        matchCount: matches.length,
        topSimilarity: matches[0]?.similarity || 0,
        topMatchType: matches[0]?.match_type || "none",
        matchTypes: matches.reduce((acc, m) => {
          acc[m.match_type] = (acc[m.match_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        variantCount: matchedQuestions.length,
        systemVersion: "v2-hybrid",
      },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in chat-rag-v2 function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        systemVersion: "v2",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
