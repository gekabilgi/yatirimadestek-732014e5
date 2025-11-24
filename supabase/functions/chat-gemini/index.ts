import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

// --- AYARLAR ---
const GEMINI_MODEL_NAME = "gemini-2.5-flash";

// KRİTİK DOSYA URI (Google AI Studio'dan aldığınız URI)
const CRITICAL_LIST_FILE_URI = Deno.env.get("CRITICAL_PDF_URI");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- YARDIMCI FONKSİYONLAR ---

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

// Temizleme Fonksiyonları
const cleanProvince = (text: string): string => {
  let cleaned = text.replace(/'da$|'de$|\sili$/i, "").trim();
  if (!cleaned) return text.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};
const cleanDistrict = (text: string) =>
  text.trim() ? text.trim().charAt(0).toUpperCase() + text.trim().slice(1) : text.trim();
const parseOsbStatus = (text: string) => {
  const lower = text.toLowerCase().trim();
  if (lower.match(/içi|içinde|evet|var/)) return "İÇİ";
  if (lower.match(/dışı|dışında|hayır|yok/)) return "DIŞI";
  return null;
};
const normalizeRegionNumbers = (text: string) => {
  return text
    .replace(/birinci/gi, "1.")
    .replace(/ikinci/gi, "2.")
    .replace(/üçüncü/gi, "3.")
    .replace(/dördüncü/gi, "4.")
    .replace(/beşinci/gi, "5.")
    .replace(/altıncı/gi, "6.");
};

// Response Temizleme
function extractTextAndChunks(response: any) {
  const candidate = response?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const parts = candidate?.content?.parts ?? [];

  const textPieces: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (p.thought === true) continue;
    if (p.executableCode || p.codeExecutionResult) continue;
    if (typeof p.text === "string") {
      const t = p.text.trim();
      if (!t.startsWith("tool_code") && !t.includes("file_search.query")) {
        textPieces.push(p.text);
      }
    }
  }
  return { finishReason, groundingChunks, textOut: textPieces.join("") };
}

// --- ANA EDGE FUNCTION ---

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { storeName, messages, sessionId } = await req.json();
    console.log(`=== Request: ${GEMINI_MODEL_NAME} (Hybrid Fix) ===`);

    if (!storeName) throw new Error("storeName is required");
    if (!messages || messages.length === 0) throw new Error("No messages found");

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === "user");
    if (!lastUserMessage) throw new Error("No user message found");

    // --- SUPABASE CONTEXT LOGIC ---
    const lowerContent = lastUserMessage.content.toLowerCase();
    const isIncentiveRelated = /teşvik|tesvik|hesapla|yatırım|yatirim|destek|sektör|sektor|üretim|uretim/.test(
      lowerContent,
    );
    const supabase = getSupabaseAdmin();
    let incentiveQuery: any = null;

    if (isIncentiveRelated && sessionId) {
      const { data: existingQuery } = await supabase
        .from("incentive_queries")
        .select()
        .eq("session_id", sessionId)
        .maybeSingle();
      if (existingQuery) {
        incentiveQuery = existingQuery;
        const uMsg = lastUserMessage.content;
        let updated = false;
        if (!incentiveQuery.sector) {
          incentiveQuery.sector = uMsg;
          updated = true;
        } else if (!incentiveQuery.province) {
          incentiveQuery.province = cleanProvince(uMsg);
          updated = true;
        } else if (!incentiveQuery.district) {
          incentiveQuery.district = cleanDistrict(uMsg);
          updated = true;
        } else if (!incentiveQuery.osb_status) {
          const osb = parseOsbStatus(uMsg);
          if (osb) {
            incentiveQuery.osb_status = osb;
            updated = true;
          }
        }

        if (updated) {
          const allFilled =
            incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;
          await supabase
            .from("incentive_queries")
            .update({
              ...incentiveQuery,
              status: allFilled ? "complete" : "collecting",
            })
            .eq("id", incentiveQuery.id);
        }
      } else {
        const { data: newQuery } = await supabase
          .from("incentive_queries")
          .insert({ session_id: sessionId, status: "collecting" })
          .select()
          .single();
        if (newQuery) incentiveQuery = newQuery;
      }
    } else if (isIncentiveRelated && !sessionId) {
      incentiveQuery = { status: "collecting" };
    }

    const ai = getAiClient();

    // --- SYSTEM PROMPT ---
    const baseInstructions = `
**Sen Türkiye'deki yatırım teşvikleri konusunda uzman, AŞIRI DİKKATLİ bir veri analistisin.**
**Tüm cevaplarını SADECE sana sunulan belgelere (Ekli Dosya ve File Search) dayandır.**

⚠️ KURALLAR:
1. **KESİN EŞLEŞME (STRICT MATCHING):** Kullanıcı "Pektin" sorduğunda, metinde "Pektin" kelimesini ara. "Gıda katkısı" kategorisinden yola çıkarak il uydurma (Inference Yasak).
2. **EKSİKSİZ TARAMA:** Sana ekte verdiğim 'Yatırım Konuları Listesi'ni BAŞTAN SONA OKU. 5 il varsa 5'ini de listele.
3. **KAYNAK KONTROLÜ:** Bilgi belgelerde yoksa "Yüklenen belgelerde bulunamadı" de.
`;

    const interactiveInstructions = `
ŞU AN BİLGİ TOPLAMA MODUNDASIN.
Mevcut Durum: ${incentiveQuery ? JSON.stringify(incentiveQuery) : "Bilinmiyor"}
Kullanıcıdan eksik bilgileri iste.
`;

    const systemPrompt =
      incentiveQuery && incentiveQuery.status === "collecting"
        ? baseInstructions + "\n\n" + interactiveInstructions
        : baseInstructions;

    // --- ⚠️ FORMAT DÜZELTME (FIX: Mixing Content and Parts) ---

    // 1. Adım: Geçmiş mesajları (History) SDK Formatına Çevir
    // Frontend'den gelen {role: 'user', content: '...'} formatını {role: 'user', parts: [{text: '...'}]} formatına çeviriyoruz.
    const historyContents = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model", // 'assistant' yerine 'model' kullanılmalı
      parts: [{ text: m.content }],
    }));

    // 2. Adım: Son Mesajı (Hibrit Mesaj) Oluştur
    const userContentParts: any[] = [];

    // Kritik dosya varsa ekle
    if (CRITICAL_LIST_FILE_URI) {
      userContentParts.push({
        fileData: {
          mimeType: "application/pdf",
          fileUri: CRITICAL_LIST_FILE_URI,
        },
      });
      userContentParts.push({
        text: "\n(SİSTEM: Yukarıdaki PDF 'Yatırım Konuları Listesi'dir. Ürün aramalarında bu dosyayı satır satır tara.)\n",
      });
    }

    // Kullanıcı sorusunu güçlendirerek ekle
    const normalizedMsg = normalizeRegionNumbers(lastUserMessage.content);
    userContentParts.push({
      text: `${normalizedMsg}\n\n(GÖREV: Eğer bir liste isteniyorsa, ekteki dosyayı oku ve kelimenin tam eşleştiği TÜM satırları eksiksiz listele.)`,
    });

    const lastMessageContent = {
      role: "user",
      parts: userContentParts,
    };

    // 3. Adım: Hepsini Tek Dizide Birleştir
    const finalContents = [...historyContents, lastMessageContent];

    // --- GEMINI API ÇAĞRISI ---
    console.log("=== Calling Gemini (Format Fixed) ===");

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: finalContents, // Artık hepsi 'parts' formatında, hata vermez.
      config: {
        temperature: 0.0,
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

    const { finishReason, groundingChunks, textOut } = extractTextAndChunks(response);

    if (finishReason === "SAFETY") {
      return new Response(JSON.stringify({ error: "Güvenlik Engeli", blocked: true }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- ENRICHMENT ---
    let enrichedChunks = [];
    if (groundingChunks && groundingChunks.length > 0) {
      const docIds = groundingChunks
        .map((c: any) => {
          const rc = c.retrievedContext ?? {};
          if (rc.documentName) return rc.documentName;
          if (rc.title && rc.title.startsWith("fileSearchStores/")) return rc.title;
          return rc.title ? `${storeName}/documents/${rc.title}` : null;
        })
        .filter((id: string | null): id is string => !!id);

      const uniqueDocIds = [...new Set(docIds)];
      const documentMetadataMap: Record<string, string> = {};
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

      for (const rawId of uniqueDocIds) {
        try {
          const documentName = rawId.startsWith("fileSearchStores/") ? rawId : `${storeName}/documents/${rawId}`;
          const url = `https://generativelanguage.googleapis.com/v1beta/${documentName}?key=${GEMINI_API_KEY}`;
          const docResp = await fetch(url);
          if (docResp.ok) {
            const docData = await docResp.json();
            const customMeta = docData.customMetadata || [];
            const filenameMeta = customMeta.find((m: any) => m.key === "Dosya" || m.key === "fileName");
            if (filenameMeta) documentMetadataMap[rawId] = filenameMeta.stringValue || filenameMeta.value || rawId;
          }
        } catch (e) {
          console.error(`Meta fetch error`, e);
        }
      }

      enrichedChunks = groundingChunks.map((chunk: any) => {
        const rc = chunk.retrievedContext ?? {};
        const rawId = rc.documentName || rc.title || null;
        return {
          ...chunk,
          enrichedFileName: rawId ? (documentMetadataMap[rawId] ?? null) : null,
        };
      });
    }

    const result = {
      text: textOut,
      groundingChunks: enrichedChunks || [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
