import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

// --- CORS HEADERS ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- CLIENT HELPERS ---
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

// --- TEXT CLEANING & EXTRACTION ---
// Modelin "Düşünme" (Thought) veya "Kod Çalıştırma" çıktılarını temizler.
function extractTextAndChunks(response: any) {
  const candidate = response?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const parts = candidate?.content?.parts ?? [];

  const textPieces: string[] = [];

  for (const p of parts) {
    if (!p) continue;
    // Teknik kısımları atla
    if (p.thought === true) continue;
    if (p.executableCode || p.codeExecutionResult) continue;
    if (p.functionCall || p.toolCall) continue;

    // String olmayanları atla
    if (typeof p.text !== "string") continue;

    const t = p.text.trim();
    // Python tool loglarını temizle
    if (t.startsWith("tool_code") || t.startsWith("code_execution_result") || t.includes("file_search.query")) {
      continue;
    }

    textPieces.push(p.text);
  }

  const textOut = textPieces.join("");
  return { finishReason, groundingChunks, textOut };
}

// --- MAIN SERVE FUNCTION ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, messages, sessionId } = await req.json();
    console.log(`=== Chat Request: Session ${sessionId} ===`);

    const supabase = getSupabaseAdmin();

    // 1. RAG Modunu Kontrol Et (Admin Panelinden)
    const { data: ragModeData } = await supabase
      .from("admin_settings")
      .select("setting_value_text")
      .eq("setting_key", "chatbot_rag_mode")
      .single();

    const ragMode = ragModeData?.setting_value_text || "gemini_file_search";

    // 🛑 EĞER VERTEX RAG SEÇİLİYSE (Önceki konuşmalarda kurduğumuz yapı)
    if (ragMode === "vertex_rag_corpora") {
      // Bu kısım Vertex AI (Cloud) tarafına yönlendirir.
      // Eğer Vertex AI kullanacaksanız buranın aktif olması lazım.
      // Şimdilik Gemini File Search (AI Studio) mantığına odaklanıyoruz (Aşağısı).
    }

    // ==========================================
    // DEFAULT FLOW: GEMINI FILE SEARCH (AI STUDIO)
    // ==========================================
    if (!storeName) throw new Error("storeName is required for Gemini File Search");

    const lastUserMessage = messages[messages.length - 1];

    // İl isimlerini ve bölge numaralarını düzelt
    const userMessageContent = lastUserMessage.content
      .replace(/birinci/gi, "1.")
      .replace(/ikinci/gi, "2.")
      .replace(/altıncı/gi, "6.")
      .trim();

    const ai = getAiClient();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    // --- PROMPT MÜHENDİSLİĞİ (GÜÇLENDİRİLMİŞ) ---
    const systemPrompt = `
GÖREVİN: Türkiye Yatırım Teşvik Sistemi uzmanı olarak, SADECE YÜKLENEN BELGELERİ kullanarak soruları yanıtlamak.

BELGE KULLANIM KURALLARI:
1. **ASLA UYDURMA:** Cevabı belgelerde (özellikle "sectorsearching", "9903_karar", "tesvik_sorgulama") bulamazsan "Belgelerde bilgi yok" de.
2. **LİSTELEME:** Kullanıcı "Hangi illerde?" derse, belgede geçen TÜM illeri madde madde yaz. Asla "ve diğerleri" deme. 50 il varsa 50'sini de yaz.
3. **TABLO OKUMA:** Excel verilerini okurken satırları dikkatli birleştir. "Öncelikli Yatırım: True" görüyorsan "Öncelikli Yatırım kapsamındadır" de.
4. **HESAPLAMA:** Eğer yatırım tutarı veya oran sorulursa, "location_support" dosyasındaki oranları kullan.

FORMAT:
- Profesyonel, net ve Türkçe cevap ver.
- Cevabın sonuna mutlaka "Bilgiler Yüklenen Dosyalardan Derlenmiştir" notunu düş.
`;

    // Geçmiş mesajları hazırla
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Son mesajı ekle
    const chatContent = [...history, { role: "user", parts: [{ text: userMessageContent }] }];

    console.log("🚀 Gemini 2.5 Flash Çağrılıyor...");

    // --- GEMINI ÇAĞRISI ---
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Hız ve mantık için en iyisi
      contents: chatContent,
      config: {
        temperature: 0.1, // DÜŞÜK SICAKLIK = DAHA AZ HALÜSİNASYON
        maxOutputTokens: 8192,
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

    // --- SONUCU İŞLE ---
    let { finishReason, groundingChunks, textOut } = extractTextAndChunks(response);

    console.log("📊 Gemini Sonucu:", {
      textLength: textOut.length,
      chunksFound: groundingChunks.length,
      finishReason,
    });

    // --- BOŞ CEVAP KONTROLÜ ---
    if (!textOut || textOut.length < 5) {
      textOut =
        "Üzgünüm, aradığınız kriterlere uygun bilgiyi yüklenen belgeler içinde bulamadım. Lütfen sorunuzu (örneğin il veya sektör belirterek) detaylandırın.";
    }

    // --- ENRICHMENT (Belge İsimlerini Ekleme) ---
    // Grounding chunk'ların içindeki "fileSearchStores/..." ID'lerini gerçek dosya adına çevirir.
    return await enrichAndReturn(textOut, groundingChunks, storeName, GEMINI_API_KEY || "");
  } catch (error: any) {
    console.error("❌ Kritik Hata:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- HELPER: ENRICHMENT ---
async function enrichAndReturn(textOut: string, groundingChunks: any[], storeName: string, apiKey: string) {
  // Benzersiz Doküman ID'lerini topla
  const docIds = new Set<string>();
  groundingChunks.forEach((c: any) => {
    const title = c.retrievedContext?.title;
    if (title) docIds.add(title);
  });

  const metadataMap: Record<string, string> = {};

  // Her doküman için API'den gerçek ismini (metadata) çek
  for (const rawId of docIds) {
    try {
      // ID formatını düzelt
      const docName = rawId.startsWith("fileSearchStores/") ? rawId : `${storeName}/documents/${rawId}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/${docName}?key=${apiKey}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Dosya adını bul (Custom Metadata veya Display Name)
        const fileName = data.customMetadata?.find((m: any) => m.key === "fileName")?.stringValue || data.displayName;
        if (fileName) metadataMap[rawId] = fileName;
      }
    } catch (e) {
      console.warn(`Metadata fetch error for ${rawId}`);
    }
  }

  // Chunk'lara dosya ismini ekle
  const enrichedChunks = groundingChunks.map((c: any) => {
    const rawId = c.retrievedContext?.title;
    return {
      ...c,
      sourceFile: rawId ? metadataMap[rawId] || "Bilinmeyen Belge" : null,
    };
  });

  return new Response(
    JSON.stringify({
      text: textOut,
      sources: [...new Set(Object.values(metadataMap))], // Benzersiz kaynak listesi
      groundingChunks: enrichedChunks,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
