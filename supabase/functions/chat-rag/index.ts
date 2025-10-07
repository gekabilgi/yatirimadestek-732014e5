// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INFO_SENTENCE = "Başvuru ve detaylı bilgi için https://yerelkalkinmahamlesi.sanayi.gov.tr adresini ziyaret edin.";
const BADGE_TAG = "[badge: Yerel Kalkınma Hamlesi|https://yerelkalkinmahamlesi.sanayi.gov.tr]";

// --- Utils ---

/**
 * Eğer yanıt "<İl> Yerel Kalkınma Hamlesi Yatırım Konuları ..." ile başlıyorsa true döner.
 * "Soru: <İl> ..." ile başlamış olsa bile tespit eder (bazı durumlarda model Soru/Cevap formatı döndürebilir).
 */
function shouldAppendBadge(answer: string): boolean {
  const t = (answer || "").trim();
  // Türkçe karakterleri de kapsayan geniş bir il adı kalıbı ile başta arama
  const re = /^(?:Soru:\s*)?[A-Za-zÇĞİÖŞÜçğıöşü\s\-]+Yerel Kalkınma Hamlesi Yatırım Konuları/i;
  return re.test(t);
}

/**
 * Sonuna bilgi cümlesi ve badge işaretini ekler (zaten varsa yinelenmez).
 */
function appendInfoAndBadge(answer: string): string {
  let out = answer?.trim() ?? "";

  // Bilgi cümlesi yoksa ekle
  if (!out.includes("yerelkalkinmahamlesi.gov.tr")) {
    const sep = out.endsWith(".") ? " " : "\n";
    out += `${sep}${INFO_SENTENCE}`;
  }

  // Badge yoksa ekle
  if (!out.includes(BADGE_TAG)) {
    out += `\n${BADGE_TAG}`;
  }

  return out;
}

// --- OpenAI Embedding ---
async function generateEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI Embedding API error:", response.status, error);
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding as number[];
}

// --- Query Expansion ---
async function expandQuery(shortQuery: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const words = shortQuery.trim().split(/\s+/);
  if (words.length > 6) return shortQuery; // Already detailed enough

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "Sen Türkçe sorguları genişletip tam cümleler haline getiren bir asistansın. Kullanıcı kısa anahtar kelimeler verdiğinde, bunları tam bir soru cümlesine dönüştür. Sadece genişletilmiş soruyu döndür, başka açıklama ekleme.",
        },
        {
          role: "user",
          content: `Bu kısa sorguyu tam bir soru cümlesine çevir: "${shortQuery}"`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.warn("Query expansion failed, using original query");
    return shortQuery;
  }

  const data = await response.json();
  return data.choices[0].message.content.trim() || shortQuery;
}

// --- Turkish Character Normalization ---
function turkishFold(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

// --- Lovable Chat Completion ---
async function generateResponse(context: string, question: string, matchedQuestions: string[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  // System prompt: kural (6) hem bilgi cümlesi hem badge işareti içeriyor.
  const systemPrompt = `Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın. 
Resmi Soru-Cevap dokümanlarına dayanarak kullanıcı sorularını cevaplıyorsun.

ÖNEMLİ KURALLAR:
1. Sadece sağlanan bilgi bankasındaki bilgilere dayanarak cevap ver.
2. Bilgi bankasında tam cevap varsa, o cevabı kullan.
3. Eğer bilgi bankasında ALAKALI bilgi yoksa, kesinlikle "Üzgünüm, bu konuda bilgi bankamda yeterli bilgi yok. Lütfen başka bir soru sorun." de.
4. Asla bilgi bankasında olmayan bilgileri uydurma veya genel bilgilerle cevap verme.
5. Cevapları Türkçe, net ve profesyonel bir şekilde ver.
6. Eğer yanıt "<İl> Yerel Kalkınma Hamlesi Yatırım Konuları" ile başlıyorsa, cevabın sonuna aşağıdaki işareti *aynen* ekle:
   [badge: Yerel Kalkınma Hamlesi|https://yerelkalkinmahamlesi.sanayi.gov.tr]
   Bu işareti metin içinde HTML'e dönüştürmeye çalışma; sadece bu işareti yaz.

Not: Badge işaretini aynen yaz, köşeli parantez söz dizimini bozma.`;

  const questionContext =
    matchedQuestions.length > 0
      ? `\n\nBenzer Sorular:\n${matchedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "";

  const userPrompt = `Bilgi Bankası (Resmi Soru-Cevap Dokümanı):
${context}${questionContext}

Kullanıcı Sorusu: ${question}

Lütfen yukarıdaki bilgi bankasındaki bilgilere dayanarak soruyu cevapla. Eğer bilgi bankasında alakalı bilgi yoksa, kesinlikle "Üzgünüm, bu konuda bilgi bankamda yeterli bilgi yok" de.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // daha deterministik
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Chat API error:", response.status, error);
    if (response.status === 429) {
      throw new Error("Şu anda çok fazla istek var. Lütfen birkaç saniye sonra tekrar deneyin.");
    }
    if (response.status === 402) {
      throw new Error("AI servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.");
    }
    throw new Error(`Chat generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}

// --- HTTP Server ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      throw new Error("Geçerli bir soru girin");
    }

    console.log("Processing question:", question);

    // 1) Expand short queries for better semantic understanding
    const expandedQuestion = await expandQuery(question);
    console.log("Expanded question:", expandedQuestion);

    // 2) Generate embedding using expanded query
    const queryEmbedding = await generateEmbedding(expandedQuestion);
    console.log("Generated query embedding");

    // 3) Find similar documents with lower threshold for better recall
    const { data: matches, error: searchError } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // Lower threshold for more recall
      match_count: 25,      // More candidates for re-ranking
    });

    if (searchError) {
      console.error("Search error:", searchError);
      throw new Error("Arama sırasında bir hata oluştu");
    }

    const foundCount = matches?.length || 0;
    console.log(`Found ${foundCount} similar documents`);

    // 4) Turkish city-aware re-ranking
    const cityMatch = expandedQuestion.match(/\b([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+[Yy]erel\s+[Kk]alkınma/);
    const detectedCity = cityMatch ? cityMatch[1] : null;
    
    if (detectedCity) {
      console.log("Detected city:", detectedCity);
      const normalizedCity = turkishFold(detectedCity);
      
      // Re-rank: boost documents that mention the detected city
      matches.sort((a: any, b: any) => {
        const aContent = turkishFold(a.content || "");
        const bContent = turkishFold(b.content || "");
        const aCityMatch = aContent.includes(normalizedCity + " yerel kalkinma");
        const bCityMatch = bContent.includes(normalizedCity + " yerel kalkinma");
        
        if (aCityMatch && !bCityMatch) return -1;
        if (!aCityMatch && bCityMatch) return 1;
        return b.similarity - a.similarity; // Fallback to similarity
      });
      
      console.log("Top 3 after city re-ranking:", matches.slice(0, 3).map((m: any) => m.filename));
    } else {
      console.log("No city detected, using semantic ranking only");
      console.log("Top 3 by similarity:", matches.slice(0, 3).map((m: any) => m.filename));
    }

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({
          answer: "Üzgünüm, bu konuda bilgi bankamda yeterli bilgi yok. Lütfen başka bir soru sorun.",
          sources: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Eşleşen soruları çıkar (Soru: ... kalıbı)
    const matchedQuestions: string[] = matches
      .filter((m: any) => typeof m.content === "string" && m.content.includes("Soru:"))
      .map((m: any) => {
        const q = m.content.match(/Soru:\s*(.+?)(?=Cevap:|$)/is);
        return q ? q[1].trim() : null;
      })
      .filter((q: string | null): q is string => !!q)
      .slice(0, 3);

    // 4) Bağlam oluştur (en iyi 5 kayıt)
    const context = matches
      .slice(0, 5)
      .map((m: any) => m.content)
      .join("\n\n---\n\n");

    console.log("Generating response with Q&A context");
    console.log("Matched questions:", matchedQuestions);

    // 5) LLM yanıtı
    let answer = await generateResponse(context, question, matchedQuestions);
    console.log("Generated response");

    // 6) Sunucu tarafı güvenlik ağı: koşul sağlanıyorsa cümle + badge ekle
    if (shouldAppendBadge(answer)) {
      answer = appendInfoAndBadge(answer);
    }

    // 7) Yanıtla
    return new Response(
      JSON.stringify({
        answer,
        sources: matches.slice(0, 5).map((m: any) => ({
          filename: m.filename,
          similarity: m.similarity,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in chat-rag:", error);
    return new Response(JSON.stringify({ error: error?.message || "Bir hata oluştu" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
