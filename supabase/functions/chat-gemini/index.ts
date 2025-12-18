import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getAiClient(): GoogleGenAI {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Custom RAG handler
async function handleCustomRagChat(supabase: any, storeId: string, messages: any[], sessionId: string) {
  const lastUserMessage = messages[messages.length - 1];

  // Get store config
  const { data: store } = await supabase.from("custom_rag_stores").select("*").eq("id", storeId).single();

  if (!store) throw new Error("Custom RAG store not found");

  // Generate embedding for query
  const embedding = await generateEmbedding(lastUserMessage.content, store.embedding_model, store.embedding_dimensions);

  // Search chunks
  const { data: chunks } = await supabase.rpc("match_custom_rag_chunks", {
    query_embedding: `[${embedding.join(",")}]`,
    p_store_id: storeId,
    match_threshold: 0.3,
    match_count: 30,
  });

  // Build context
  const context = chunks?.map((c: any) => c.content).join("\n\n---\n\n") || "";

  // Generate response with Gemini
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `Context:\n${context}\n\nSoru: ${lastUserMessage.content}` }],
      },
    ],
    config: { temperature: 0.1 },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return new Response(
    JSON.stringify({ text, sources: chunks?.map((c: any) => c.document_name) || [], customRag: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function generateEmbedding(text: string, model: string, dimensions: number): Promise<number[]> {
  if (model === "gemini") {
    const ai = getAiClient();
    const result = await ai.models.embedContent({
      model: "models/text-embedding-001",
      contents: [{ parts: [{ text }] }],
      config: {
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: dimensions,
      },
    });
    return result.embeddings[0].values;
  } else {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-large",
        input: text,
        dimensions: dimensions,
      }),
    });
    const data = await response.json();
    return data.data[0].embedding;
  }
}

// Support Programs Search Functions
const normalizeSupportQuery = (input: string): string =>
  input
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/ı/g, "i")
    .trim();

function isSupportProgramQuery(message: string): boolean {
  const q = normalizeSupportQuery(message);

  // Program kodları (örn. "1507 desteği") açıkça destek programlarını işaret eder
  const programCodeMatch = /\b(1501|1507|1509|1602|4006)\b/.test(q);
  if (programCodeMatch) return true;

  // "destek" kökü Türkçe çekimlerde "destegi/destekleri" gibi görünebilir
  const hasDestekRoot = q.includes("destek") || q.includes("desteg");

  const keywords = [
    "destek programi",
    "destek programlari",
    "destekler",
    "hibe",
    "hibeler",
    "cagri",
    "cagrilar",
    "acik cagri",
    "basvuru",
    "fon",
    "finansman",
    "tubitak",
    "kosgeb",
    "kalkinma ajansi",
    "tkdk",
    "kobi destegi",
    "arge",
    "ar ge",
    "ar-ge",
    "ihracat destegi",
    "guncel destekler",
    "hangi destekler",
    "ne tur destekler",
    "destek var mi",
    "basvurabilecegim",
    "yararlanabilecegim",
    "destek programlarini",
  ];

  return hasDestekRoot || keywords.some((kw) => q.includes(kw));
}

async function searchSupportPrograms(query: string, supabase: any): Promise<any[]> {
  const enrichPrograms = async (programRows: any[]) => {
    const enrichedPrograms = await Promise.all(
      programRows.map(async (p: any) => {
        // Get institution
        const { data: institution } = await supabase
          .from("institutions")
          .select("id, name")
          .eq("id", p.institution_id)
          .single();

        // Get tags
        const { data: tagLinks } = await supabase
          .from("support_program_tags")
          .select("tag_id, tags(id, name, category_id, tag_categories(id, name))")
          .eq("support_program_id", p.id);

        // Get files
        const { data: files } = await supabase
          .from("file_attachments")
          .select("id, filename, file_url")
          .eq("support_program_id", p.id);

        const tags =
          tagLinks
            ?.map((t: any) => ({
              id: t.tags?.id,
              name: t.tags?.name,
              category: t.tags?.tag_categories,
            }))
            .filter((t: any) => t.id) || [];

        return {
          id: p.id,
          title: p.title,
          kurum: institution?.name || "Bilinmiyor",
          son_tarih: p.application_deadline,
          ozet: p.description?.substring(0, 300) + (p.description?.length > 300 ? "..." : ""),
          uygunluk:
            p.eligibility_criteria?.substring(0, 200) + (p.eligibility_criteria?.length > 200 ? "..." : ""),
          iletisim: p.contact_info,
          belgeler: files || [],
          tags,
          detay_link: `/program/${p.id}`,
        };
      }),
    );

    return enrichedPrograms;
  };

  try {
    const normalized = normalizeSupportQuery(query);

    // 1) Program kodu sorularında embedding'e bağımlı kalmadan direkt eşleştir (1501, 1507, ...)
    const code = normalized.match(/\b(1501|1507|1509|1602|4006)\b/)?.[1];
    if (code) {
      console.log(`🎯 Support search: direct lookup by program code: ${code}`);
      const { data: directPrograms, error: directErr } = await supabase
        .from("support_programs")
        .select(
          "id, title, description, eligibility_criteria, application_deadline, contact_info, institution_id",
        )
        .ilike("title", `%${code}%`)
        .limit(5);

      if (directErr) {
        console.error("Error in direct support program lookup:", directErr);
      } else if (directPrograms?.length) {
        console.log(`✅ Direct code lookup matched ${directPrograms.length} program(s)`);
        return await enrichPrograms(directPrograms);
      } else {
        console.log("⚠️ Direct code lookup returned 0 rows, falling back to embedding search");
      }
    }

    // 2) Embedding ile arama (daha genel sorgular)
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.log("⚠️ No OpenAI API key for support program embedding search");
      return [];
    }

    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
        dimensions: 1536,
      }),
    });

    if (!embeddingResponse.ok) {
      console.error("Failed to generate embedding for support search");
      return [];
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data?.[0]?.embedding;
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      console.error("Support search embedding response missing embedding array");
      return [];
    }

    const { data: programs, error } = await supabase.rpc("match_support_programs", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      match_threshold: 0.55,
      match_count: 6,
    });

    if (error) {
      console.error("Error searching support programs (rpc match_support_programs):", error);
      return [];
    }

    if (!programs || programs.length === 0) {
      console.log("No matching support programs found via embeddings");
      return [];
    }

    console.log(`Found ${programs.length} matching support programs`);
    return await enrichPrograms(programs);
  } catch (err) {
    console.error("Error in searchSupportPrograms:", err);
    return [];
  }
}

// Vertex RAG yanıtının "bilgi bulunamadı" mesajı içerip içermediğini kontrol et
function isNoResultsFoundResponse(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  
  const noResultsPatterns = [
    /verilen kaynaklarda.*?bilgi bulunmamaktadır/i,
    /belgelerde.*?bilgi bulunmamaktadır/i,
    /bu konuda.*?bilgi bulunamamıştır/i,
    /kaynaklarda.*?bilgi yoktur/i,
    /dokümanlarda.*?bilgi bulunamadı/i,
    /ilgili.*?kaynak bulunamadı/i,
    /herhangi bir bilgi.*?bulunmamaktadır/i,
    /bu konuyla ilgili.*?bilgi mevcut değil/i,
    /hakkında.*?bilgi bulunmamaktadır/i,
    /destekleri hakkında bilgi bulunmamaktadır/i,
  ];
  
  // Check if the text is just "---" or contains no real content
  const trimmed = text.trim();
  if (trimmed === '---' || trimmed === '' || /^-+\s*$/.test(trimmed)) {
    return true;
  }
  
  return noResultsPatterns.some(pattern => pattern.test(text));
}

const cleanProvince = (text: string): string => {
  let cleaned = text
    .replace(/'da$/i, "")
    .replace(/'de$/i, "")
    .replace(/\sda$/i, "")
    .replace(/\sde$/i, "")
    .replace(/\sta$/i, "")
    .replace(/\ste$/i, "")
    .replace(/\sili$/i, "")
    .replace(/\sİli$/i, "")
    .trim();

  if (!cleaned) return text.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const cleanDistrict = (text: string): string => {
  const cleaned = text.trim();
  if (!cleaned) return text.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const parseOsbStatus = (text: string): "İÇİ" | "DIŞI" | null => {
  const lower = text.toLowerCase().trim();
  if (
    lower.includes("içi") ||
    lower.includes("içinde") ||
    lower.includes("osb içi") ||
    lower.includes("organize sanayi içi") ||
    lower === "içi" ||
    lower === "ici" ||
    lower === "evet" ||
    lower === "var"
  ) {
    return "İÇİ";
  }
  if (
    lower.includes("dışı") ||
    lower.includes("dışında") ||
    lower.includes("osb dışı") ||
    lower === "dışı" ||
    lower === "disi" ||
    lower.includes("hayır") ||
    lower.includes("hayir") ||
    lower.includes("değil") ||
    lower.includes("degil") ||
    lower === "yok"
  ) {
    return "DIŞI";
  }
  return null;
};

// Türkiye'deki tüm il isimleri
const TURKISH_PROVINCES = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Ankara",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Iğdır",
  "Isparta",
  "İstanbul",
  "İzmir",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kilis",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Şanlıurfa",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

const normalizeRegionNumbers = (text: string): string => {
  const replacements: Record<string, string> = {
    "birinci bölge": "1. Bölge",
    "ikinci bölge": "2. Bölge",
    "üçüncü bölge": "3. Bölge",
    "dördüncü bölge": "4. Bölge",
    "beşinci bölge": "5. Bölge",
    "altıncı bölge": "6. Bölge",
    "altinci bölge": "6. Bölge",
    "birinci bölgedeli": "1. Bölge",
    "ikinci bölgedeli": "2. Bölge",
    "üçüncü bölgedeli": "3. Bölge",
    "dördüncü bölgedeli": "4. Bölge",
    "beşinci bölgedeli": "5. Bölge",
    "altıncı bölgedeli": "6. Bölge",
    "altinci bölgedeli": "6. Bölge",
  };

  let normalized = text;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(pattern, "gi");
    normalized = normalized.replace(regex, replacement);
  }

  return normalized;
};

// FIX 1: Robustly filter out internal tool and thought content (tool call leakage).
function extractTextAndChunks(response: any) {
  const candidate = response?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const parts = candidate?.content?.parts ?? [];

  // ✅ Detaylı debug logging
  console.log("🔍 extractTextAndChunks - Input Analysis:", {
    hasCandidates: !!response?.candidates,
    candidateCount: response?.candidates?.length || 0,
    finishReason,
    partsCount: parts.length,
    groundingChunksCount: groundingChunks.length,
  });

  const textPieces: string[] = [];

  for (const p of parts) {
    if (!p) continue;

    console.log("📝 Processing part:", {
      hasText: !!p.text,
      textLength: p.text?.length || 0,
      isThought: p.thought === true,
      hasCode: !!(p.executableCode || p.codeExecutionResult),
      hasFunctionCall: !!(p.functionCall || p.toolCall),
    });

    if (p.thought === true) {
      console.log("⏭️ Skipping thought part");
      continue;
    }
    if (p.executableCode || p.codeExecutionResult) {
      console.log("⏭️ Skipping code execution part");
      continue;
    }
    if (p.functionCall || p.toolCall) {
      console.log("⏭️ Skipping tool call part");
      continue;
    }
    if (typeof p.text !== "string") {
      console.log("⏭️ Skipping non-string part");
      continue;
    }

    const t = p.text.trim();
    if (t.startsWith("tool_code") || t.startsWith("code_execution_result")) {
      console.log("⏭️ Skipping tool_code block");
      continue;
    }
    if (t.includes("file_search.query(")) {
      console.log("⏭️ Skipping file_search query");
      continue;
    }

    textPieces.push(p.text);
    console.log("✅ Added text piece (length:", p.text.length, ")");
  }

  const textOut = textPieces.join("");

  console.log("📊 extractTextAndChunks - Final Result:", {
    totalTextLength: textOut.length,
    textPreview: textOut.substring(0, 150) + (textOut.length > 150 ? "..." : ""),
    groundingChunksCount: groundingChunks.length,
  });

  return { finishReason, groundingChunks, textOut };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, messages, sessionId } = await req.json();
    console.log("=== chat-gemini request ===");
    console.log("storeName:", storeName);
    console.log("sessionId:", sessionId);
    console.log("messages count:", messages?.length);

    const supabase = getSupabaseAdmin();

    // Check RAG mode
    const { data: ragModeData } = await supabase
      .from("admin_settings")
      .select("setting_value_text")
      .eq("setting_key", "chatbot_rag_mode")
      .single();

    const ragMode = ragModeData?.setting_value_text || "gemini_file_search";
    console.log("🔧 RAG Mode:", ragMode);

    // If custom RAG mode, use custom RAG search
    if (ragMode === "custom_rag") {
      const { data: customStoreData } = await supabase
        .from("admin_settings")
        .select("setting_value_text")
        .eq("setting_key", "active_custom_rag_store")
        .single();

      const customStoreId = customStoreData?.setting_value_text;

      if (customStoreId) {
        console.log("🔍 Using Custom RAG store:", customStoreId);
        // Delegate to custom RAG handler
        return await handleCustomRagChat(supabase, customStoreId, messages, sessionId);
      }
    }

    // Site içi destekler modu - sadece support_programs tablosunu kullan
    if (ragMode === "site_ici_destekler") {
      console.log("🔍 Using Site İçi Destekler mode");
      
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find((m: any) => m.role === "user");
      
      if (!lastUserMessage) {
        throw new Error("No user message found");
      }

      // Support programs araması yap
      const supportCards = await searchSupportPrograms(lastUserMessage.content, supabase);
      console.log(`📋 Found ${supportCards.length} support programs`);

      if (supportCards.length > 0) {
        return new Response(
          JSON.stringify({
            text: "İlgili destek programlarını aşağıda listeliyorum.",
            supportCards,
            supportOnly: true,
            sources: [],
            groundingChunks: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({
            text: "Aradığınız kriterlere uygun destek programı bulunamadı. Lütfen farklı anahtar kelimelerle tekrar deneyin.",
            supportCards: [],
            sources: [],
            groundingChunks: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If Vertex RAG mode, delegate to vertex-rag-query function (HYBRID: parallel search)
    if (ragMode === "vertex_rag_corpora") {
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find((m: any) => m.role === "user");
      
      if (!lastUserMessage) {
        throw new Error("No user message found");
      }

      // Get corpus settings first
      const { data: vertexCorpusData } = await supabase
        .from("admin_settings")
        .select("setting_value_text")
        .eq("setting_key", "active_vertex_corpus")
        .single();

      const corpusName = vertexCorpusData?.setting_value_text;

      if (corpusName) {
        console.log("🔍 Using Vertex RAG Corpus:", corpusName);

        // Get Vertex RAG settings
        const { data: settingsData } = await supabase
          .from("admin_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["vertex_rag_top_k", "vertex_rag_threshold"]);

        const topK = settingsData?.find((s) => s.setting_key === "vertex_rag_top_k")?.setting_value || 10;
        const threshold = settingsData?.find((s) => s.setting_key === "vertex_rag_threshold")?.setting_value || 0.3;

        // HYBRID: Run both Vertex RAG and Support Programs search in PARALLEL
        console.log("🔄 [Vertex Hybrid] Running parallel search: Vertex RAG + Support Programs");
        
        const [vertexResponse, supportCards] = await Promise.all([
          // 1. Vertex RAG query
          (async () => {
            try {
              const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/vertex-rag-query`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: req.headers.get("Authorization") || "",
                },
                body: JSON.stringify({
                  corpusName,
                  messages,
                  topK,
                  vectorDistanceThreshold: threshold,
                }),
              });

              if (!response.ok) {
                console.error(`Vertex RAG query failed: ${response.status}`);
                return null;
              }
              return await response.json();
            } catch (error) {
              console.error("Vertex RAG error:", error);
              return null;
            }
          })(),
          
          // 2. Support Programs search (always run in parallel)
          searchSupportPrograms(lastUserMessage.content, supabase)
        ]);

        console.log(`📋 [Vertex Hybrid] Vertex response: ${vertexResponse ? 'OK' : 'null'}, Support cards: ${supportCards.length}`);

        // Combine results
        if (vertexResponse) {
          const ragText = vertexResponse.text || '';
          const noResultsInRag = isNoResultsFoundResponse(ragText);
          
          // If we have both Vertex response and support cards, combine them
          if (supportCards.length > 0) {
            if (noResultsInRag) {
              // RAG'da bilgi yok ama destek kartları var - pozitif yönlendirme
              console.log("🔄 [Vertex Hybrid] No results in RAG, showing positive redirect with support cards");
              return new Response(
                JSON.stringify({
                  ...vertexResponse,
                  text: "📋 **Bu konuyla ilgili sitemizdeki güncel destek programlarına göz atabilirsiniz:**",
                  supportCards,
                  noRagResults: true,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            // RAG'da bilgi var ve destek kartları da var - ikisini birleştir
            console.log("✅ [Vertex Hybrid] Combining Vertex RAG response with support cards");
            return new Response(
              JSON.stringify({
                ...vertexResponse,
                text: `${ragText}\n\n---\n\n📋 **Ayrıca aşağıdaki güncel destek programları da ilginizi çekebilir:**`,
                supportCards,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          // Only Vertex response, no support cards
          if (noResultsInRag) {
            // RAG'da bilgi yok ve destek kartı da yok - kullanıcıya alternatif yol öner
            console.log("⚠️ [Vertex Hybrid] No results in RAG and no support cards");
            return new Response(
              JSON.stringify({
                ...vertexResponse,
                text: "Üzgünüm, bu konuyla ilgili kaynaklarımızda bilgi bulunamadı. Lütfen farklı anahtar kelimelerle tekrar deneyin veya [Destek Ara](/destek-ara) sayfasından arama yapabilirsiniz.",
                noRagResults: true,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(JSON.stringify(vertexResponse), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Vertex RAG failed but we have support cards
        if (supportCards.length > 0) {
          console.log("📋 [Vertex Hybrid] Vertex failed, returning only support cards");
          return new Response(
            JSON.stringify({
              text: "📋 **Bu konuyla ilgili sitemizdeki güncel destek programlarına göz atabilirsiniz:**",
              supportCards,
              supportOnly: true,
              sources: [],
              groundingChunks: [],
              vertexRag: true,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Both failed
        throw new Error("Vertex RAG query failed and no support programs found");
      }
    }

    // Default: Use Gemini File Search (existing flow)
    if (!storeName) {
      throw new Error("storeName is required");
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages must be a non-empty array");
    }

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === "user");
    if (!lastUserMessage) {
      throw new Error("No user message found");
    }

    // Search support programs if query matches
    const isSupportQuery = isSupportProgramQuery(lastUserMessage.content);

    let supportCards: any[] = [];
    if (isSupportQuery) {
      console.log("🔍 Detected support program query, searching...");
      supportCards = await searchSupportPrograms(lastUserMessage.content, supabase);
      console.log(`📋 Found ${supportCards.length} support programs`);
    }

    const lowerContent = lastUserMessage.content.toLowerCase();

    // Eğer kullanıcı doğrudan program kodu soruyorsa, LLM yerine kartları gösterelim.
    const programCodeInQuery = /\b(1501|1507|1509|1602|4006)\b/.test(lowerContent);
    if (programCodeInQuery && supportCards.length > 0) {
      return await enrichAndReturn(
        "İlgili destek programlarını aşağıda listeliyorum.",
        [],
        storeName,
        GEMINI_API_KEY || "",
        { supportCards, supportOnly: true },
      );
    }

    const isIncentiveRelated =
      (lowerContent.includes("teşvik") ||
        lowerContent.includes("tesvik") ||
        lowerContent.includes("hesapla") ||
        lowerContent.includes("yatırım") ||
        lowerContent.includes("yatirim") ||
        lowerContent.includes("destek") ||
        lowerContent.includes("sektör") ||
        lowerContent.includes("sektor") ||
        lowerContent.includes("üretim") ||
        lowerContent.includes("uretim") ||
        lowerContent.includes("imalat")) &&
      !isSupportQuery;

    console.log("isIncentiveRelated:", isIncentiveRelated);

    let incentiveQuery: any = null;

    if (isIncentiveRelated && sessionId) {
      const { data: existingQuery, error: queryError } = await supabase
        .from("incentive_queries")
        .select()
        .eq("session_id", sessionId)
        .maybeSingle();

      if (queryError) {
        console.error("Error checking incentive_queries:", queryError);
      }

      if (existingQuery) {
        incentiveQuery = existingQuery;
        console.log("✓ Found existing incentive query:", incentiveQuery);

        const userContent = lastUserMessage.content;
        let updated = false;

        // Note: The slot filling logic below is sequential and prone to the "greedy" problem.
        // It's left as is to match your original structure, but the prompt fixes
        // and history cleanup should make the chatbot's *output* cleaner.
        if (!incentiveQuery.sector) {
          incentiveQuery.sector = userContent;
          updated = true;
        } else if (!incentiveQuery.province) {
          const province = cleanProvince(userContent);
          incentiveQuery.province = province;
          updated = true;
        } else if (!incentiveQuery.district) {
          const district = cleanDistrict(userContent);
          incentiveQuery.district = district;
          updated = true;
        } else if (!incentiveQuery.osb_status) {
          const osbStatus = parseOsbStatus(userContent);
          if (osbStatus) {
            incentiveQuery.osb_status = osbStatus;
            updated = true;
          }
        }

        if (updated && incentiveQuery.id) {
          const allFilled =
            incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;
          const newStatus = allFilled ? "complete" : "collecting";

          const { error: updateError } = await supabase
            .from("incentive_queries")
            .update({
              sector: incentiveQuery.sector,
              province: incentiveQuery.province,
              district: incentiveQuery.district,
              osb_status: incentiveQuery.osb_status,
              status: newStatus,
            })
            .eq("id", incentiveQuery.id);

          if (updateError) {
            console.error("Error updating incentive_queries:", updateError);
          } else {
            incentiveQuery.status = newStatus;
            console.log("✓ Updated incentive query:", incentiveQuery);
          }
        }
      } else {
        const { data: newQuery, error: insertError } = await supabase
          .from("incentive_queries")
          .insert({
            session_id: sessionId,
            status: "collecting",
            sector: null,
            province: null,
            district: null,
            osb_status: null,
          })
          .select()
          .single();

        if (!insertError && newQuery) {
          incentiveQuery = newQuery;
          console.log("✓ Started new incentive query:", incentiveQuery);
        } else {
          console.error("Error starting incentive query:", insertError);
        }
      }
    } else if (isIncentiveRelated && !sessionId) {
      incentiveQuery = {
        id: null,
        session_id: null,
        status: "collecting",
        sector: null,
        province: null,
        district: null,
        osb_status: null,
      };
      console.log("Started in-memory incentive query (no sessionId):", incentiveQuery);
    }

    const ai = getAiClient();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const generationConfig = {
      temperature: 0.3,
      maxOutputTokens: 8192,
    };

    const getSlotFillingStatus = (query: any): string => {
      const slots = ["sector", "province", "district", "osb_status"];
      const filled = slots.filter((slot) => query[slot]).length;
      return `${filled}/4 bilgi toplandı`;
    };

    const getNextSlotToFill = (query: any): string => {
      if (!query.sector) return "Sektör bilgisi sor";
      if (!query.province) return "İl bilgisi sor";
      if (!query.district) return "İlçe bilgisi sor";
      if (!query.osb_status) return "OSB durumu sor";
      return "Tüm bilgiler toplandı - Hesaplama yap";
    };

    const incentiveSlotFillingInstruction = incentiveQuery
      ? `
## ⚠️ MOD VE KURALLAR ⚠️

**DURUM:** Şu an yatırımcıdan eksik bilgileri topluyorsun.
**MEVCUT İLERLEME:** ${getSlotFillingStatus(incentiveQuery)}

**CEVAP STRATEJİSİ (ÖNEMLİ):**
1. **Eğer Kullanıcı Soru Sorduysa:** (Örn: "Kütahya hangi bölgede?", "KDV istisnası nedir?")
   - **ÖNCE CEVAPLA:** Yüklenen belgelerden (Karar ekleri, il listeleri vb.) cevabı bul ve kullanıcıya ver.
   - **SONRA DEVAM ET:** Cevabın hemen ardından, eksik olan sıradaki bilgiyi sor.
   - *Örnek:* "Kütahya ili genel teşvik sisteminde 4. bölgede yer almaktadır. Peki yatırımınızı hangi ilçede yapmayı planlıyorsunuz?"

2. **Eğer Kullanıcı Sadece Veri Verdiyse:** (Örn: "Tekstil", "Ankara")
   - Kısa bir onay ver ve sıradaki eksik bilgiyi sor.
   - Maksimum 2 cümle kullan.

**Toplanan Bilgiler:**
${incentiveQuery.sector ? `✓ Sektör: ${incentiveQuery.sector}` : "○ Sektör: Bekleniyor"}
${incentiveQuery.province ? `✓ İl: ${incentiveQuery.province}` : "○ İl: Bekleniyor"}
${incentiveQuery.district ? `✓ İlçe: ${incentiveQuery.district}` : "○ İlçe: Bekleniyor"}
${incentiveQuery.osb_status ? `✓ OSB Durumu: ${incentiveQuery.osb_status}` : "○ OSB Durumu: Bekleniyor"}

**SONRAKİ HEDEF:** ${getNextSlotToFill(incentiveQuery)}

${
  incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status
    ? `
**HESAPLAMA ZAMANI:**
Tüm bilgiler toplandı. Şimdi "tesvik_sorgulama.pdf" dosyasındaki SÜREÇ AKIŞI'na [kaynak 72-73] göre teşvik hesabı yap.
`
    : ""
}
`
      : "";

    const interactiveInstructions = `
Sen bir yatırım teşvik danışmanısın. ŞU AN BİLGİ TOPLAMA MODUNDASIN.

"tesvik_sorgulama.pdf" dosyasındaki "SÜREÇ AKIŞI" [kaynak 62-71] ve "Örnek Akış"a [kaynak 89-100] uymalısın.

⚠️ KRİTİK KURALLAR:
1. AKILLI ANALİZ: Kullanıcı "çorap üretimi" veya "Kütahya'da yatırım" derse, bu verileri kaydet ve bir sonraki eksik veriye geç.
2. TEK SORU: Her seferinde SADECE TEK BİR soru sor.
3. PDF AKIŞI: 1) Sektör → 2) İl → 3) İlçe → 4) OSB durumu
4. ESNEKLİK (SORU CEVAPLAMA): Kullanıcı akış sırasında bilgi talep ederse (Örn: "Kütahya kaçıncı bölge?"), "Bilgi veremem" DEME. Belgeden (özellikle 9903 Karar Ekleri) bilgiyi bul, soruyu cevapla ve akışa kaldığın yerden devam et.

⚠️ YASAK DAVRANIŞLAR:
- Kullanıcıya ders verir gibi uzun, gereksiz paragraflar yazma.
- Kullanıcı veri girdiğinde (Sektör: Demir) tekrar "Hangi sektör?" diye sorma.
`;

    const baseInstructions = `
**Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
**Kullanıcı tarafından sorulan bir soruyu öncelikle tüm dökümanlarda ara, eğer sorunun cevabı özel kurallara uygunsa hangi kural en uygun ise ona göre cevabı oluştur, eğer interaktif bir sohbet olarak algılarsan "interactiveInstructions" buna göre hareket et.
**Tüm cevaplarını mümkün olduğunca YÜKLEDİĞİN BELGELERE dayanarak ver.
**Soruları **Türkçe** cevapla.
**Belge içeriğiyle çelişen veya desteklenmeyen genellemeler yapma.

⚠️ ÖNEMLİ: Belge içeriklerini AYNEN KOPYALAMA. Bilgileri kendi cümlelerinle yeniden ifade et, özetle ve açıkla. Hiçbir zaman doğrudan alıntı yapma.

## İL LİSTELEME KURALLARI (ÇOK ÖNEMLİ):
Bir ürün/sektör hakkında "hangi illerde" sorulduğunda:
1. Belgede geçen **TÜM illeri madde madde listele** - eksik bırakma!
2. "Mersin ve Giresun illerinde..." gibi özet YAPMA!
3. Her ili **ayrı satırda, numaralandırarak** yaz:
   1. Mersin - [yatırım konusu açıklaması]
   2. Tokat - [yatırım konusu açıklaması]
   3. Isparta - [yatırım konusu açıklaması]
   ...
4. **"ve diğerleri", "gibi" deme** - hepsini yaz
5. Eğer belgede 8 il varsa, 8'ini de listele
6. İl sayısını **yanıltıcı şekilde azaltma**

Özel Kurallar:
- 9903 sayılı karar, yatırım teşvikleri hakkında genel bilgiler, destek unsurları soruları, tanımlar, müeyyide, devir, teşvik belgesi revize, tamamlama vizesi ve mücbir sebep gibi idari süreçler vb. kurallar ve şartlarla ilgili soru sorulduğunda sorunun cevaplarını mümkün mertebe "9903_karar.pdf" dosyasında ara.
- İllerin Bölge Sınıflandırması sorulduğunda (Örn: Kütahya kaçıncı bölge?), cevabı 9903 sayılı kararın eklerinde veya ilgili tebliğ dosyalarında (EK-1 İllerin Bölgesel Sınıflandırması) ara.
- 9903 sayılı kararın uygulanmasına ilişkin usul ve esaslar, yatırım teşvik belgesi başvuru şartları (yöntem, gerekli belgeler), hangi yatırım cinslerinin (komple yeni, tevsi, modernizasyon vb.) ve harcamaların destek kapsamına alınacağı, özel sektör projeleri için Stratejik Hamle Programı değerlendirme kriterleri ve süreci, güneş/rüzgar enerjisi, veri merkezi, şarj istasyonu gibi belirli yatırımlar için aranan ek şartlar ile faiz/kâr payı, sigorta primi, vergi indirimi gibi desteklerin ödeme ve uygulama usullerine ilişkin bir soru geldiğinde, cevabı öncelikle ve ağırlıklı olarak "2025-1-9903_teblig.pdf" dosyası içinde ara ve yanıtını mümkün olduğunca bu dosyadaki hükümlere dayandır.
- Yerel kalkınma hamlesi, yerel yatırım konuları gibi ifadelerle soru sorulduğunda, yada örneğin; pektin yatırımını nerde yapabilirim gibi sorular geldiğinde "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında yatırım konusu içerisinde pektin kelimesi geçen yatırım konularına göre sorunun cevaplarını ara. Yatırım konularında parantez içerisinde bile geçse onları da dahil et.
- 9495 sayılı karar kapsamında proje bazlı yatırımlar, çok büyük ölçekli yatırımlar hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2016-9495_Proje_Bazli.pdf" dosyasında ara
- 9495 sayılı kararın uygulanmasına yönelik usul ve esaslarla ilgili tebliğ için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2019-1_9495_teblig.pdf" dosyasında ara
- HIT 30 programı kapsamında elektrikli araç, batarya, veri merkezleri ve alt yapıları, yarı iletkenlerin üretimi, Ar-Ge, kuantum, robotlar vb. yatırımları için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "Hit30.pdf" dosyasında ara
- Yatırım taahhütlü avans kredisi, ytak hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "ytak.pdf" ve "ytak_hesabi.pdf" dosyalarında ara
- 9903 saylı karar ve karara ilişkin tebliğde belirlenmemiş "teknoloji hamlesi programı" hakkında programın uygulama esaslarını, bağımsız değerlendirme süreçleri netleştirilmiş ve TÜBİTAK'ın Ar-Ge bileşenlerini değerlendirme rolü, Komite değerlendirme kriterleri, başvuruları hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "teblig_teknoloji_hamlesi_degisiklik.pdf" dosyasında ara 
- Bir yatırım konusu sorulursa veya bir yatırım konusu hakkında veya nace kodu sorulursa "sectorsearching.xlsx" dosyasında ara.
- Etuys için "Sistemsel Sorunlar (Açılmama, İmza Hatası vs.)", "Belge Başvurusuna İlişkin sorular", "Devir İşlemleri", "Revize Başvuruları", "Yerli ve İthal Gerçekleştirmeler-Fatura ve Gümrük İşlemleri", "Vergi İstisna Yazısı Alma İşlemleri", "Tamamlama Vizesi İşlemleri", ve "hata mesajları" ile ilgili sistemsel sorunlarda çözüm arayanlar için "etuys_systemsel_sorunlar.txt" dosyasında ara.
- Bilgileri verirken mutlaka kendi cümlelerinle açıkla, özetle ve yeniden ifade et. Belge içeriğini kelimesi kelimesine kopyalama.
- Eğer yüklenen belgeler soruyu kapsamıyorsa "Bu soru yüklenen belgelerin kapsamı dışında, sadece genel kavramsal açıklama yapabilirim." diye belirt ve genel kavramı çok kısa özetle.
- En son satıra detaylı bilgi almak için ilgili ilin yatırım destek ofisi ile iletişime geçebilirsiniz.
`;

    const normalizedUserMessage = normalizeRegionNumbers(lastUserMessage.content);
    const messagesForGemini = [
      ...messages.slice(0, -1),
      {
        ...lastUserMessage,
        content: normalizedUserMessage,
      },
    ];

    const systemPrompt =
      incentiveQuery && incentiveQuery.status === "collecting"
        ? baseInstructions + "\n\n" + interactiveInstructions + "\n\n" + incentiveSlotFillingInstruction
        : baseInstructions;

    console.log("=== Calling Gemini ===");
    console.log("systemPrompt length:", systemPrompt.length);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messagesForGemini
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }))
        // FIX 3: Filter out assistant messages containing the leaked tool content
        // to prevent the AI from learning the bad behavior.
        .filter((m: any) => m.role === "user" || !m.parts[0].text.includes("tool_code\nprint(file_search.query")),
      config: {
        ...generationConfig,
        systemInstruction: systemPrompt,
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
            },
          },
        ],
      },
    });

    console.log("=== Gemini response received ===");

    let { finishReason, groundingChunks, textOut } = extractTextAndChunks(response);

    console.log("📊 Initial Response Analysis:", {
      textLength: textOut.length,
      textPreview: textOut.substring(0, 150),
      chunksCount: groundingChunks.length,
      finishReason,
    });

    // Extract main keyword from user query for validation (e.g., "pektin" from "pektin hangi illerde")
    const queryKeywords = normalizedUserMessage
      .toLowerCase()
      .replace(/hangi (il|şehir|yer|yerde|yerlerde|illerde)|nerede|nerelerde|desteklen.*|var|üretim/gi, "")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 3); // Min 4 character words

    console.log("🔍 Extracted query keywords for validation:", queryKeywords);

    // ============= ADIM 1: BOŞ YANIT KONTROLÜ VE DYNAMIC RETRY =============
    if (!textOut || textOut.trim().length === 0) {
      console.warn("⚠️ Empty response detected! Triggering Gemini-powered retry...");

      const retryPrompt = `
🔍 ÖNCEKİ ARAMADA SONUÇ BULUNAMADI - DERİN ARAMA MODUNA GEÇİLİYOR

Kullanıcının Orijinal Sorusu: "${normalizedUserMessage}"

GÖREV:
1. Bu soruyu yanıtlamak için ÖNCE şu soruyu kendin yanıtla:
   - Ana anahtar kelime nedir? (Örn: "krom cevheri" → "krom")
   - Hangi eş anlamlıları aramam gerek? (Örn: "krom madenciliği", "krom üretimi", "krom rezervi")
   - Hangi üst kategoriye ait? (Örn: "maden", "metal", "hammadde")
   - İlgili NACE kodları var mı?

2. ŞİMDİ bu alternatif terimlerle File Search yap:
   - Dosyalar: ykh_teblig_yatirim_konulari_listesi_yeni.pdf, 9903_karar.pdf, sectorsearching.xlsx
   - SATIR SATIR TARA, her sayfayı kontrol et
   - Her aramayı farklı terimlerle TEKRARLA (en az 3 varyasyon)

3. BULDUĞUN TÜM SONUÇLARI LİSTELE:
   - İl adlarını eksik bırakma
   - "ve diğerleri" deme
   - Eğer belgede geçen 8 il varsa, 8'ini de yaz

4. Eğer gerçekten hiçbir sonuç yoksa:
   "Bu konuda doğrudan destek sağlayan bir yatırım konusu bulunamamıştır. Ancak [ÜST KATEGORİ] kapsamında değerlendirilebilir" de.

BAŞLA! 🚀
`;

      const retryResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: retryPrompt }],
          },
        ],
        config: {
          temperature: 0.05, // Maksimum deterministik
          maxOutputTokens: 8192,
          systemInstruction: baseInstructions,
          tools: [{ fileSearch: { fileSearchStoreNames: [storeName] } }],
        },
      });

      const retryResult = extractTextAndChunks(retryResponse);
      console.log("🔄 Retry Result:", {
        textLength: retryResult.textOut.length,
        chunksCount: retryResult.groundingChunks.length,
      });

      // Retry sonrası hala boşsa fallback
      if (!retryResult.textOut || retryResult.textOut.trim().length === 0) {
        console.error("❌ Retry failed - returning fallback message");
        return new Response(
          JSON.stringify({
            text: "Üzgünüm, belgelerimde bu konuyla ilgili doğrudan bilgi bulamadım. Lütfen sorunuzu farklı kelimelerle ifade ederek tekrar deneyin veya ilgili Yatırım Destek Ofisi ile iletişime geçin.",
            groundingChunks: [],
            emptyResponse: true,
            retriedWithDynamicSearch: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Retry başarılı! Yeni sonuçları kullan
      console.log("✅ Retry successful - using new results");
      textOut = retryResult.textOut;
      groundingChunks = retryResult.groundingChunks;
      finishReason = retryResult.finishReason;

      // Enrichment işlemini retry sonuçları için de yapacağız (aşağıda)
    }

    // ============= ADIM 2: ANAHTAR KELİME VALİDASYONU (KEYWORD FILTERING) =============
    // Genişletilmiş il sorgusu pattern'i
    const isProvinceQuery =
      /hangi (il|şehir|yer|yerde|yerlerde|illerde)|nerede|nerelerde|nereye|kaç il|tek il|birkaç il|hangi bölge|desteklenen iller|desteklenen şehirler/i.test(
        normalizedUserMessage,
      );

    // VALIDATE grounding chunks contain query keywords (for province queries)
    // CRITICAL FIX: Only include chunks where investment topic ACTUALLY mentions the searched keyword
    let validatedChunks = groundingChunks;
    if (isProvinceQuery && queryKeywords.length > 0) {
      const mainKeyword = queryKeywords[0]; // Primary keyword (e.g., "pektin")

      validatedChunks = groundingChunks.filter((chunk) => {
        const chunkContent = (chunk.retrievedContext?.text || "").toLowerCase();

        // Extract investment topic from chunk (text between "- " and newline or end)
        const topicMatch = chunkContent.match(/(?:^|\n)(.+?(?:\(.*?\))?)\s*(?:\n|$)/);
        const investmentTopic = topicMatch ? topicMatch[1] : chunkContent;

        // Check if the main keyword appears in the investment topic description
        // This prevents "Fındık Kabuğu... (aktif karbon...)" from matching "pektin" queries
        const topicContainsKeyword = investmentTopic.includes(mainKeyword);

        if (!topicContainsKeyword) {
          console.log(`❌ FILTERED chunk - keyword "${mainKeyword}" NOT in investment topic:`, {
            title: chunk.retrievedContext?.title,
            investmentTopic: investmentTopic.substring(0, 150),
          });
        } else {
          console.log(`✅ VALID chunk - keyword "${mainKeyword}" found in:`, {
            title: chunk.retrievedContext?.title,
            investmentTopic: investmentTopic.substring(0, 150),
          });
        }

        return topicContainsKeyword;
      });

      console.log(
        `🔍 Strict keyword validation: ${groundingChunks.length} chunks → ${validatedChunks.length} validated chunks`,
      );

      // Update groundingChunks with validated ones
      groundingChunks = validatedChunks;
    }

    // Gerçek Türkiye il listesiyle filtreleme
    const foundProvinces = TURKISH_PROVINCES.filter((province) => textOut.includes(province));
    const uniqueProvinces = [...new Set(foundProvinces)];

    console.log("🔍 Province Query Analysis:", {
      isProvinceQuery,
      foundProvinces: uniqueProvinces.length,
      provinces: uniqueProvinces.slice(0, 10).join(", ") + (uniqueProvinces.length > 10 ? "..." : ""),
    });

    if (isProvinceQuery && uniqueProvinces.length > 0 && uniqueProvinces.length < 3) {
      console.warn(
        `⚠️ Insufficient province results (${uniqueProvinces.length}/expected ≥3). Triggering feedback loop...`,
      );

      const feedbackPrompt = `
⚠️ ÖNCEKİ CEVABINIZ YETERSİZ BULUNDU - GENİŞLETİLMİŞ ARAMA GEREKLİ

Kullanıcı Sorusu: "${normalizedUserMessage}"

Senin Önceki Cevabın: "${textOut.substring(0, 300)}..."

SORUN: Sadece ${uniqueProvinces.length} il buldun (${uniqueProvinces.join(", ")}). 
Bu sayı şüpheli derecede az!

YENİ GÖREV:
1. ykh_teblig_yatirim_konulari_listesi_yeni.pdf dosyasını BAŞTAN SONA yeniden tara
2. Ana anahtar kelimenin (${normalizedUserMessage}) tüm varyasyonlarını ara:
   - Tam eşleşme
   - Kök kelime
   - Üst kategori
   - Alt ürün grupları
3. Her sayfayı kontrol et - ATLAMA
4. Bulduğun TÜM illeri madde madde listele
5. Eğer gerçekten bu kadar azsa, yanıtına şunu ekle:
   "ℹ️ Not: Sistemimizde sadece bu ${uniqueProvinces.length} ilde bu konuyla ilgili doğrudan kayıt bulunmaktadır."

BAŞLA! 🔍
`;

      const feedbackResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: feedbackPrompt }],
          },
        ],
        config: {
          temperature: 0.05, // Daha da deterministik
          maxOutputTokens: 8192,
          systemInstruction: baseInstructions,
          tools: [{ fileSearch: { fileSearchStoreNames: [storeName] } }],
        },
      });

      const feedbackResult = extractTextAndChunks(feedbackResponse);
      console.log("🔁 Feedback Loop Result:", {
        textLength: feedbackResult.textOut.length,
        originalProvinces: uniqueProvinces.length,
        newText: feedbackResult.textOut.substring(0, 200),
      });

      // Feedback loop sonrası daha iyi sonuç varsa kullan
      if (feedbackResult.textOut && feedbackResult.textOut.length > textOut.length) {
        console.log("✅ Feedback loop improved results - using enhanced response");
        textOut = feedbackResult.textOut;
        groundingChunks = feedbackResult.groundingChunks;
        finishReason = feedbackResult.finishReason;

        // Flag ekle ki frontend bilsin
        const finalWithFeedback = await enrichAndReturn(textOut, groundingChunks, storeName, GEMINI_API_KEY || "", {
          enhancedViaFeedbackLoop: true,
          supportCards,
        });
        return finalWithFeedback;
      }
    }

    // ============= SAFETY CHECK =============
    if (finishReason === "SAFETY") {
      console.log("⚠️ Response blocked due to:", finishReason);

      return new Response(
        JSON.stringify({
          error:
            "Üzgünüm, bu soruya güvenli bir şekilde cevap veremiyorum. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin.",
          blocked: true,
          reason: finishReason,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let finalText = textOut;

    // Normal flow için de enrichment yap
    return await enrichAndReturn(finalText, groundingChunks, storeName, GEMINI_API_KEY || "", { supportCards });
  } catch (error) {
    console.error("❌ Error in chat-gemini:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// ============= HELPER FUNCTION: ENRICHMENT =============
async function enrichAndReturn(
  textOut: string,
  groundingChunks: any[],
  storeName: string,
  apiKey: string,
  extraFlags: Record<string, any> = {},
) {
  // Extract document IDs
  const docIds = groundingChunks
    .map((c: any) => {
      const rc = c.retrievedContext ?? {};
      if (rc.documentName) return rc.documentName;
      if (rc.title) {
        return rc.title.startsWith("fileSearchStores/") ? rc.title : `${storeName}/documents/${rc.title}`;
      }
      return null;
    })
    .filter((id: string | null): id is string => !!id);

  const uniqueDocIds = [...new Set(docIds)];
  const documentMetadataMap: Record<string, string> = {};

  console.log("=== Fetching Document Metadata ===");
  console.log("Unique document IDs:", uniqueDocIds);

  const normalizeDocumentName = (rawId: string): string => {
    if (rawId.startsWith("fileSearchStores/")) return rawId;
    return `${storeName}/documents/${rawId}`;
  };

  for (const rawId of uniqueDocIds) {
    try {
      const documentName = normalizeDocumentName(rawId);
      const url = `https://generativelanguage.googleapis.com/v1beta/${documentName}?key=${apiKey}`;
      console.log(`Fetching metadata for: ${documentName}`);

      const docResp = await fetch(url);
      if (docResp.ok) {
        const docData = await docResp.json();
        const customMeta = docData.customMetadata || [];

        const filenameMeta = customMeta.find((m: any) => m.key === "Dosya" || m.key === "fileName");

        if (filenameMeta) {
          const enrichedName = filenameMeta.stringValue || filenameMeta.value || rawId;
          documentMetadataMap[rawId] = enrichedName;
          console.log(`✓ Enriched ${rawId} -> ${enrichedName}`);
        }
      } else {
        console.error(`Failed to fetch ${documentName}: ${docResp.status}`);
      }
    } catch (e) {
      console.error(`Error fetching metadata for ${rawId}:`, e);
    }
  }

  // Enrich chunks
  const enrichedChunks = groundingChunks.map((chunk: any) => {
    const rc = chunk.retrievedContext ?? {};
    const rawId = rc.documentName || rc.title || null;

    return {
      ...chunk,
      enrichedFileName: rawId ? (documentMetadataMap[rawId] ?? null) : null,
    };
  });

  console.log("=== Enrichment Complete ===");

  const result = {
    text: textOut,
    groundingChunks: enrichedChunks,
    ...extraFlags,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
