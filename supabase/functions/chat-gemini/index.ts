import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

// --- AYARLAR ---
// Hız ve maliyet için 2.5 Flash seçildi.
// Eğer bu model henüz API anahtarınızda aktif değilse 'gemini-1.5-flash' yapabilirsiniz.
const GEMINI_MODEL_NAME = "gemini-2.5-pro";

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

// Metin Temizleme ve Normalize Etme Fonksiyonları
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

// Response Temizleme (Tool Leakage Önleme)
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
    if (p.functionCall || p.toolCall) continue;
    if (typeof p.text !== "string") continue;

    const t = p.text.trim();
    if (t.startsWith("tool_code") || t.startsWith("code_execution_result")) continue;
    if (t.includes("file_search.query(")) continue;

    textPieces.push(p.text);
  }

  const textOut = textPieces.join("");
  return { finishReason, groundingChunks, textOut };
}

// --- ANA EDGE FUNCTION ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, messages, sessionId } = await req.json();
    console.log(`=== chat-gemini (${GEMINI_MODEL_NAME}) request ===`);
    console.log("sessionId:", sessionId);

    if (!storeName) throw new Error("storeName is required");
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("messages must be a non-empty array");

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === "user");
    if (!lastUserMessage) throw new Error("No user message found");

    // --- TEŞVİK SORGULAMA MANTIĞI (Aynen Korundu) ---
    const lowerContent = lastUserMessage.content.toLowerCase();
    const isIncentiveRelated =
      lowerContent.includes("teşvik") ||
      lowerContent.includes("tesvik") ||
      lowerContent.includes("hesapla") ||
      lowerContent.includes("yatırım") ||
      lowerContent.includes("yatirim") ||
      lowerContent.includes("destek") ||
      lowerContent.includes("sektör") ||
      lowerContent.includes("sektor") ||
      lowerContent.includes("üretim") ||
      lowerContent.includes("uretim") ||
      lowerContent.includes("imalat");

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
        const userContent = lastUserMessage.content;
        let updated = false;

        if (!incentiveQuery.sector) {
          incentiveQuery.sector = userContent;
          updated = true;
        } else if (!incentiveQuery.province) {
          incentiveQuery.province = cleanProvince(userContent);
          updated = true;
        } else if (!incentiveQuery.district) {
          incentiveQuery.district = cleanDistrict(userContent);
          updated = true;
        } else if (!incentiveQuery.osb_status) {
          const osb = parseOsbStatus(userContent);
          if (osb) {
            incentiveQuery.osb_status = osb;
            updated = true;
          }
        }

        if (updated && incentiveQuery.id) {
          const allFilled =
            incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;
          const newStatus = allFilled ? "complete" : "collecting";
          await supabase
            .from("incentive_queries")
            .update({
              sector: incentiveQuery.sector,
              province: incentiveQuery.province,
              district: incentiveQuery.district,
              osb_status: incentiveQuery.osb_status,
              status: newStatus,
            })
            .eq("id", incentiveQuery.id);
          incentiveQuery.status = newStatus;
        }
      } else {
        const { data: newQuery } = await supabase
          .from("incentive_queries")
          .insert({
            session_id: sessionId,
            status: "collecting",
          })
          .select()
          .single();
        if (newQuery) incentiveQuery = newQuery;
      }
    } else if (isIncentiveRelated && !sessionId) {
      incentiveQuery = { status: "collecting", sector: null, province: null, district: null, osb_status: null };
    }

    const ai = getAiClient();

    // --- SYSTEM PROMPT (GÜNCELLENMİŞ DETAYLI VERSİYON) ---

    const baseInstructions = `
**Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
**Tüm cevaplarını her zaman YÜKLEDİĞİN BELGELERE dayanarak ver.
**Soruları Türkçe cevapla.

⚠️ KRİTİK ARAMA VE CEVAPLAMA KURALLARI:
**1. **ASLA ÖZETLEME:** Kullanıcı bir liste istiyorsa (örneğin "hangi illerde?"), bulduğun 1-2 sonucu yazıp bırakma. Dökümanlarda geçen TÜM sonuçları madde madde yaz. "Ve diğerleri" ifadesini kullanmak YASAKTIR.
**2. **ASLA YORUM YAPMA (Inference Yasak):**
   - Kullanıcı "Pektin" sorduysa, belgede SADECE "Pektin" kelimesinin geçtiği illeri listele.
   - Örnek Hata: "Afyon'da gıda katkı maddesi var, pektin de katkı maddesidir, o zaman Afyon'u da ekleyeyim" DEME. Bu YASAKTIR.
   - Belgede kelime **birebir** geçmiyorsa, o ili listeye alma.

**3. **EKSİKSİZ LİSTELEME (Deep Search):**
   - Özellikle "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında arama yaparken, **belgenin tamamını** taradığından emin ol.
   - Eğer sonuç 10 tane ise 10'unu da yaz. "Bazıları şunlardır" deyip kesme.
   - illerin hepsi farklı sayfalarda olabilir. Hepsini bul.

**4. **NEGATİF KONTROL:**
   - Eğer bir ilde "Meyve tozu" yazıyor ama "Pektin" yazmıyorsa, o ili Pektin listesine EKLEME.
   
⚠️ HANGİ DOSYADA NE ARAMALISIN? (ÖZEL DOSYA REHBERİ):

**1. YEREL YATIRIMLAR VE ÜRÜN BAZLI ARAMA (⚠️ EN KRİTİK DOSYA):**
* **Dosya:** "ykh_teblig_yatirim_konulari_listesi_yeni.pdf"
* **Ne Zaman Bak:** Kullanıcı "Pektin yatırımı nerede yapılır?", "Kağıt üretimi hangi illerde desteklenir?", "Yerel kalkınma hamlesi" veya spesifik bir ürün adı sorduğunda.
* **NASIL ARA:** Bu dosyayı **SATIR SATIR TARA.** Bir ürünün adı 5 farklı ilin altında geçiyorsa, 5'ini de bulmadan cevabı oluşturma.

**2. GENEL TEŞVİK MEVZUATI VE İDARİ SÜREÇLER:**
* **Dosya:** "9903_karar.pdf"
* **Ne Zaman Bak:** Genel tanımlar, destek unsurları, müeyyide, devir, belge revize, tamamlama vizesi, mücbir sebep.
* **Bölge:** "Hangi il kaçıncı bölge?" sorularında Ek-1 listesine bak.

**3. UYGULAMA USUL VE ESASLARI (DETAYLAR):**
* **Dosya:** "2025-1-9903_teblig.pdf"
* **Ne Zaman Bak:** Başvuru şartları, harcamaların kapsamı, güneş/rüzgar enerjisi şartları, veri merkezi, şarj istasyonu kriterleri, faiz/kar payı ödeme usulleri.

**4. PROJE BAZLI SÜPER TEŞVİKLER:**
* **Dosya:** "2016-9495_Proje_Bazli.pdf" ve "2019-1_9495_teblig.pdf"
* **Ne Zaman Bak:** Çok büyük ölçekli yatırımlar, proje bazlı destekler.

**5. YÜKSEK TEKNOLOJİ (HIT-30):**
* **Dosya:** "Hit30.pdf"
* **Ne Zaman Bak:** Elektrikli araç, batarya, çip, veri merkezi, Ar-Ge, kuantum, robotik.

**6. TEKNOLOJİ ODAKLI SANAYİ HAMLESİ:**
* **Dosya:** "teblig_teknoloji_hamlesi_degisiklik.pdf"
* **Ne Zaman Bak:** TÜBİTAK Ar-Ge süreçleri, Komite değerlendirmesi, Hamle programı.

**7. NACE KODU VE SEKTÖR ARAMA:**
* **Dosya:** "sectorsearching.xlsx"
* **Ne Zaman Bak:** NACE kodu veya sektör adı sorulduğunda.

**8. SİSTEMSEL HATALAR (ETUYS):**
* **Dosya:** "etuys_systemsel_sorunlar.txt"
* **Ne Zaman Bak:** "Sistem açılmıyor", "İmza hatası", "Hata mesajları".

**Unutma:** Bilgileri verirken kopyala-yapıştır yapma, kendi cümlelerinle net ve anlaşılır şekilde açıkla. Detaylı bilgi için ilgili ilin Yatırım Destek Ofisi'ne yönlendir.
`;

    const interactiveInstructions = `
Sen bir yatırım teşvik danışmanısın. ŞU AN BİLGİ TOPLAMA MODUNDASIN.
Mevcut Durum: ${incentiveQuery ? JSON.stringify(incentiveQuery) : "Bilinmiyor"}
Kullanıcıdan eksik bilgileri (Sektör -> İl -> İlçe -> OSB) sırasıyla iste.
`;

    const systemPrompt =
      incentiveQuery && incentiveQuery.status === "collecting"
        ? baseInstructions + "\n\n" + interactiveInstructions
        : baseInstructions;

    // --- SORG U ZENGİNLEŞTİRME (QUERY INJECTION) ---
    // Modelin daha dikkatli çalışmasını sağlamak için kullanıcının mesajını arkada modifiye ediyoruz.
    const normalizedUserMessage = normalizeRegionNumbers(lastUserMessage.content);

    const augmentedUserMessage = `
${normalizedUserMessage}

(SİSTEM NOTU: Bu soruyu yanıtlarken File Search aracını kullan. 
Aradığın terimin eş anlamlılarını (synonyms) ve farklı yazılışlarını da sorguya dahil et. 
Eğer bu konu birden fazla ilde, maddede veya listede geçiyorsa, HEPSİNİ eksiksiz listele. 
Özetleme yapma. Tüm sonuçları getir. Özellikle 'ykh_teblig_yatirim_konulari_listesi_yeni.pdf' içinde detaylı arama yap.)
`;

    const messagesForGemini = [
      ...messages.slice(0, -1),
      {
        ...lastUserMessage,
        content: augmentedUserMessage, // Güçlendirilmiş mesajı gönder
      },
    ];

    const generationConfig = {
      temperature: 0.1, // Halüsinasyonu en aza indirmek için
      maxOutputTokens: 8192,
    };

    console.log("=== Calling Gemini ===");
    console.log("Using Model:", GEMINI_MODEL_NAME);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: messagesForGemini
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }))
        // Tool leakage (araç çıktı sızıntısı) engelleme filtresi
        .filter((m: any) => {
          if (m.role === "user") return true;
          const txt = m.parts?.[0]?.text || "";
          if (!txt) return true;
          if (txt.includes("tool_code") || txt.includes("file_search.query")) return false;
          return true;
        }),
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

    const { finishReason, groundingChunks, textOut } = extractTextAndChunks(response);

    if (finishReason === "SAFETY") {
      return new Response(
        JSON.stringify({
          error: "Güvenlik politikası nedeniyle yanıt oluşturulamadı. Lütfen sorunuzu farklı ifade edin.",
          blocked: true,
          reason: finishReason,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- ENRICHMENT (Dosya İsimlerini Düzeltme) ---
    // Grounding chunk'lardan dosya ID'lerini alıp gerçek dosya isimleriyle eşleştiriyoruz.
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

      // Dosya metadatasını çekmek için döngü
      for (const rawId of uniqueDocIds) {
        try {
          const documentName = rawId.startsWith("fileSearchStores/") ? rawId : `${storeName}/documents/${rawId}`;
          const url = `https://generativelanguage.googleapis.com/v1beta/${documentName}?key=${GEMINI_API_KEY}`;

          const docResp = await fetch(url);
          if (docResp.ok) {
            const docData = await docResp.json();
            const customMeta = docData.customMetadata || [];
            const filenameMeta = customMeta.find((m: any) => m.key === "Dosya" || m.key === "fileName");

            if (filenameMeta) {
              const enrichedName = filenameMeta.stringValue || filenameMeta.value || rawId;
              documentMetadataMap[rawId] = enrichedName;
            }
          }
        } catch (e) {
          console.error(`Error fetching metadata for ${rawId}:`, e);
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
