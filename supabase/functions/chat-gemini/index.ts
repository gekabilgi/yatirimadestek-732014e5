import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

// --- AYARLAR ---
// Hız ve maliyet için 2.5 Flash seçildi.
// Eğer bu model henüz API anahtarınızda aktif değilse 'gemini-1.5-flash' yapabilirsiniz.
const GEMINI_MODEL_NAME = "gemini-2.5-flash";

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
   - Kullanıcı "Pektin" sorduysa, belgede SADECE "Pektin" kelimesinin geçtiği illeri listele lütfen.
   - Örnek Hata: "Afyon'da gıda katkı maddesi var, pektin de katkı maddesidir, o zaman Afyon'u da ekleyeyim" DEME. Bu YASAKTIR.
   - Belgede kelime **birebir** geçmiyorsa, o ili listeye alma lütfen.

**3. **EKSİKSİZ LİSTELEME (Deep Search):**
   - Özellikle "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında arama yaparken, **belgenin tamamını** taradığından emin ol lütfen.
   - Eğer sonuç 10 tane ise 10'unu da yaz. "Bazıları şunlardır" deyip kesme lütfen.
   - illerin hepsi farklı sayfalarda olabilir. Hepsini bul lütfen.

**4. **NEGATİF KONTROL:**
   - Eğer bir ilde "Meyve tozu" yazıyor ama "Pektin" yazmıyorsa, o ili Pektin listesine EKLEME.
   
⚠️ HANGİ DOSYADA NE ARAMALISIN? (ÖZEL DOSYA REHBERİ):

**1. YEREL YATIRIMLAR VE ÜRÜN BAZLI ARAMA (⚠️ EN KRİTİK DOSYA):**
* **Dosya:** "ykh_teblig_yatirim_konulari_listesi_yeni.pdf"
* **Ne Zaman Bak:** Kullanıcı "Pektin yatırımı nerede yapılır?", "Kağıt üretimi hangi illerde desteklenir?", "Yerel kalkınma hamlesi" veya spesifik bir ürün adı sorduğunda:
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
Aradığın terimin eş anlamlılarını (synonyms) ve farklı yazılışlarını da sorguya dahil et lütfen. Buna göre bulduğun sonuçların olduğu kaynaklarda aranan terim/kelime/kavram yoksa sonuçlara dahil etme lütfen.
Eğer bu konu birden fazla ilde, maddede veya listede geçiyorsa, HEPSİNİ eksiksiz listele lütfen. 
Özetleme yapma. Tüm sonuçları getir. Özellikle 'ykh_teblig_yatirim_konulari_listesi_yeni.pdf' içinde detaylı arama yap lütfen.)
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

    // ============= BOŞ YANIT VE YETERSİZ SONUÇ KONTROLÜ =============
    console.log("📊 Initial Response Analysis:", {
      textLength: textOut.length,
      textPreview: textOut.substring(0, 150),
      chunksCount: groundingChunks.length,
      finishReason,
    });

    // 1️⃣ BOŞ YANIT KONTROLÜ
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
   - SATIR SATIR TAR, her sayfayı kontrol et
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
        model: GEMINI_MODEL_NAME,
        contents: [
          {
            role: "user",
            parts: [{ text: retryPrompt }],
          },
        ],
        config: {
          temperature: 0.1,
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

      if (!retryResult.textOut || retryResult.textOut.trim().length === 0) {
        console.error("❌ Retry failed - returning fallback message");
        return new Response(
          JSON.stringify({
            text: "Üzgünüm, belgelerimde bu konuyla ilgili doğrudan bilgi bulamadım. Lütfen sorunuzu farklı kelimelerle ifade ederek tekrar deneyin veya ilgili Yatırım Destek Ofisi ile iletişime geçin.",
            groundingChunks: [],
            emptyResponse: true,
            retriedWithDynamicSearch: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Retry successful - using new results");
      
      let enrichedRetryChunks = [];
      if (retryResult.groundingChunks && retryResult.groundingChunks.length > 0) {
        const docIds = retryResult.groundingChunks
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

              if (filenameMeta) {
                const enrichedName = filenameMeta.stringValue || filenameMeta.value || rawId;
                documentMetadataMap[rawId] = enrichedName;
              }
            }
          } catch (e) {
            console.error(`Error fetching metadata for ${rawId}:`, e);
          }
        }

        enrichedRetryChunks = retryResult.groundingChunks.map((chunk: any) => {
          const rc = chunk.retrievedContext ?? {};
          const rawId = rc.documentName || rc.title || null;
          return {
            ...chunk,
            enrichedFileName: rawId ? (documentMetadataMap[rawId] ?? null) : null,
          };
        });
      }

      return new Response(
        JSON.stringify({
          text: retryResult.textOut,
          groundingChunks: enrichedRetryChunks,
          retriedWithDynamicSearch: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ YETERSİZ SONUÇ KONTROLÜ (Feedback Loop)
    const isProvinceQuery = /hangi (il|şehir|yer)|(nerede|nerelerde)/i.test(normalizedUserMessage);
    const provinceMatches = textOut.match(/\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\b/g) || [];
    const uniqueProvinces = [...new Set(provinceMatches)];

    if (isProvinceQuery && uniqueProvinces.length > 0 && uniqueProvinces.length < 3) {
      console.warn(`⚠️ Insufficient province results (${uniqueProvinces.length}/expected ≥3). Triggering feedback loop...`);

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
   "ℹ️ Not: Sistemimizde sadece bu [SAYI] ilde bu konuyla ilgili doğrudan kayıt bulunmaktadır."

BAŞLA! 🔍
`;

      const feedbackResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: [
          {
            role: "user",
            parts: [{ text: feedbackPrompt }],
          },
        ],
        config: {
          temperature: 0.05,
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

      if (feedbackResult.textOut && feedbackResult.textOut.length > textOut.length) {
        console.log("✅ Feedback loop improved results - using enhanced response");
        
        let enrichedFeedbackChunks = [];
        if (feedbackResult.groundingChunks && feedbackResult.groundingChunks.length > 0) {
          const docIds = feedbackResult.groundingChunks
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

                if (filenameMeta) {
                  const enrichedName = filenameMeta.stringValue || filenameMeta.value || rawId;
                  documentMetadataMap[rawId] = enrichedName;
                }
              }
            } catch (e) {
              console.error(`Error fetching metadata for ${rawId}:`, e);
            }
          }

          enrichedFeedbackChunks = feedbackResult.groundingChunks.map((chunk: any) => {
            const rc = chunk.retrievedContext ?? {};
            const rawId = rc.documentName || rc.title || null;
            return {
              ...chunk,
              enrichedFileName: rawId ? (documentMetadataMap[rawId] ?? null) : null,
            };
          });
        }

        return new Response(
          JSON.stringify({
            text: feedbackResult.textOut,
            groundingChunks: enrichedFeedbackChunks,
            enhancedViaFeedbackLoop: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("✅ Response passed validation - proceeding with normal flow");

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
