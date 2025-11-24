import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

// --- KONFİGÜRASYON ---
// 1. Model: Uzun bağlam penceresi ve hız dengesi için 2.5 Flash idealdir.
const GEMINI_MODEL_NAME = "gemini-2.5-flash";

// 2. Kritik Dosya URI: Listeleme sorunu yaşanan dosyanın DOĞRUDAN URI adresi.
// Google AI Studio -> Library -> Files kısmından yükleyip URI'yi alıp Env Variable'a ekleyin.
const CRITICAL_LIST_FILE_URI = Deno.env.get("CRITICAL_PDF_URI");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- YARDIMCI SERVİSLER ---

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

// --- METİN İŞLEME VE TEMİZLEME ---

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
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : text.trim();
};

const parseOsbStatus = (text: string): "İÇİ" | "DIŞI" | null => {
  const lower = text.toLowerCase().trim();
  if (lower.match(/içi|içinde|evet|var/)) return "İÇİ";
  if (lower.match(/dışı|dışında|hayır|yok|değil/)) return "DIŞI";
  return null;
};

const normalizeRegionNumbers = (text: string): string => {
  // Kullanıcının yazdığı bölge ifadelerini standartlaştırır
  const replacements: Record<string, string> = {
    "birinci bölge": "1. Bölge",
    "ikinci bölge": "2. Bölge",
    "üçüncü bölge": "3. Bölge",
    "dördüncü bölge": "4. Bölge",
    "beşinci bölge": "5. Bölge",
    "altıncı bölge": "6. Bölge",
    "altinci bölge": "6. Bölge",
  };
  let normalized = text;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    normalized = normalized.replace(new RegExp(pattern, "gi"), replacement);
  }
  return normalized;
};

// --- GEMINI ÇIKTISINI TEMİZLEME (Tool Leakage Önleme) ---
function extractTextAndChunks(response: any) {
  const candidate = response?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const parts = candidate?.content?.parts ?? [];

  const textPieces: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    // Modelin kendi iç düşüncelerini veya tool kodlarını filtrele
    if (p.thought === true) continue;
    if (p.executableCode || p.codeExecutionResult) continue;
    if (p.functionCall || p.toolCall) continue;

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
  // CORS Preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { storeName, messages, sessionId } = await req.json();
    console.log(`=== Request: ${GEMINI_MODEL_NAME} ===`);

    if (!storeName) throw new Error("storeName is required");
    if (!messages || messages.length === 0) throw new Error("No messages found");

    // Kullanıcının son mesajını al
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === "user");
    if (!lastUserMessage) throw new Error("No user message found");

    // ---------------------------------------------------------
    // 1. ADIM: SUPABASE TEŞVİK SORGUSU TAKİBİ (Context Logic)
    // ---------------------------------------------------------
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
        // Slot filling logic (Eksik bilgileri doldurma)
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

        if (updated && incentiveQuery.id) {
          const allFilled =
            incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;
          await supabase
            .from("incentive_queries")
            .update({
              sector: incentiveQuery.sector,
              province: incentiveQuery.province,
              district: incentiveQuery.district,
              osb_status: incentiveQuery.osb_status,
              status: allFilled ? "complete" : "collecting",
            })
            .eq("id", incentiveQuery.id);
          if (allFilled) incentiveQuery.status = "complete";
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
      incentiveQuery = { status: "collecting", sector: null, province: null, district: null, osb_status: null };
    }

    const ai = getAiClient();

    // ---------------------------------------------------------
    // 2. ADIM: SYSTEM PROMPT (DETAYLI & KATI KURALLAR)
    // ---------------------------------------------------------
    const baseInstructions = `
**Sen Türkiye'deki yatırım teşvikleri konusunda uzman, AŞIRI DİKKATLİ bir veri analistisin.**
**Tüm cevaplarını SADECE ve SADECE sana sunulan belgelere (Ekli Dosya ve File Search) dayandır.**

⚠️ HATA ÖNLEME VE ARAMA KURALLARI (BU KURALLARIN DIŞINA ÇIKMA):

1. **KESİN EŞLEŞME (STRICT MATCHING ONLY):**
   - Kullanıcı bir ürün sorduğunda (Örn: "Pektin"), metinde SADECE "Pektin" kelimesinin geçtiği yerleri dikkate al.
   - **YASAK:** "Afyon'da gıda katkı maddesi var, pektin de katkı maddesidir, o zaman Afyon'u ekleyeyim" gibi bir çıkarım yapman KESİNLİKLE YASAKTIR. (Inference Yasak).
   - Metinde kelime açıkça geçmiyorsa, o ili listeye alma.

2. **EKSİKSİZ TARAMA (FULL SCAN):**
   - Özellikle sana doğrudan içerik olarak verdiğim "Yatırım Konuları Listesi" dosyasını başından sonuna kadar oku.
   - Eğer bir ürün 5 farklı ilde geçiyorsa, 5'ini de listelemeden cevap verme.
   - "Bazıları şunlardır", "ve diğerleri" gibi ifadeler kullanma. Tam liste ver.

3. **SİNONİM ARAMASI (DOĞRULAMA ŞARTIYLA):**
   - Kullanıcının terimini ararken (Örn: "Güneş Paneli"), metinde "Fotovoltaik", "Güneş enerjisi santrali" gibi teknik terimlerin geçtiği yerleri de kontrol et.
   - ANCAK: Bulduğun paragrafın gerçekten kullanıcının kastettiği ürünle ilgili olduğundan %100 emin ol.

4. **KAYNAK BELİRTME:**
   - Verdiğin bilginin hangi dökümana veya hangi maddeye dayandığını belirtmeye çalış.
   - Bilgi belgelerde yoksa, "Yüklenen belgelerde bu bilgi bulunmamaktadır" de.

⚠️ DOSYA KULLANIM REHBERİ:
- **Yatırım Listesi / Ürünler:** Sana doğrudan eklediğim PDF dosyasını oku.
- **Mevzuat / İdari Süreçler:** "9903 Sayılı Karar", "Tebliğler" vb. (File Search ile bul).
- **Proje Bazlı / Hit-30:** İlgili özel dosyalar (File Search ile bul).
`;

    const interactiveInstructions = `
ŞU AN BİLGİ TOPLAMA MODUNDASIN.
Mevcut Durum: ${incentiveQuery ? JSON.stringify(incentiveQuery) : "Bilinmiyor"}
Kullanıcıdan eksik bilgileri sırasıyla (Sektör -> İl -> İlçe -> OSB) iste.
Eğer kullanıcı soru sorarsa, önce soruyu cevapla, sonra kaldığın yerden bilgi istemeye devam et.
`;

    const systemPrompt =
      incentiveQuery && incentiveQuery.status === "collecting"
        ? baseInstructions + "\n\n" + interactiveInstructions
        : baseInstructions;

    // ---------------------------------------------------------
    // 3. ADIM: HİBRİT İÇERİK OLUŞTURMA (Prompt Engineering)
    // ---------------------------------------------------------

    const userContentParts: any[] = [];

    // A) Kritik Dosyayı İçeriğe Ekleme (Long Context)
    // Bu sayede "Pektin" araması için vektör veritabanına güvenmeyiz, model dosyayı okur.
    if (CRITICAL_LIST_FILE_URI) {
      userContentParts.push({
        fileData: {
          mimeType: "application/pdf",
          fileUri: CRITICAL_LIST_FILE_URI,
        },
      });
      userContentParts.push({
        text: "\n(SİSTEM: Yukarıdaki PDF, 'Yatırım Konuları Listesi'dir. Ürün/İl aramalarında bu dosyayı BAŞTAN SONA OKU.)\n",
      });
    } else {
      console.warn("⚠️ CRITICAL_PDF_URI tanımlı değil! Listeleme eksik olabilir.");
    }

    // B) Kullanıcı Mesajını Güçlendirme (Query Injection)
    const normalizedMsg = normalizeRegionNumbers(lastUserMessage.content);
    const augmentedMsg = `
${normalizedMsg}

(GÖREV YÖNERGESİ:
1. Eğer bir ürün veya sektör listesi isteniyorsa, ekteki PDF dosyasını satır satır tara.
2. Aranan kelimenin (Örn: "${normalizedMsg}") **tam eşleştiği** tüm satırları bul.
3. Asla kategori tahmini yapma ("Bu kategoriye girer" deme). Sadece metinde yazıyorsa listele.
4. Bütün sonuçları madde madde dök. Eksik bırakma.)
`;
    userContentParts.push({ text: augmentedMsg });

    // C) Mesaj Geçmişini Hazırlama
    const messagesForGemini = [
      ...messages.slice(0, -1), // Önceki mesajlar
      { role: "user", parts: userContentParts }, // Yeni hibrit mesaj
    ];

    // ---------------------------------------------------------
    // 4. ADIM: GEMINI API ÇAĞRISI
    // ---------------------------------------------------------
    console.log("=== Calling Gemini (Hybrid Mode) ===");

    const generationConfig = {
      temperature: 0.0, // 0.0 = En yüksek doğruluk, En az halüsinasyon.
      maxOutputTokens: 8192,
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: messagesForGemini,
      config: {
        ...generationConfig,
        systemInstruction: systemPrompt,
        tools: [
          {
            // Mevzuat soruları için File Search hala aktif
            fileSearch: {
              fileSearchStoreNames: [storeName],
            },
          },
        ],
      },
    });

    // ---------------------------------------------------------
    // 5. ADIM: YANIT İŞLEME VE CITATION (Enrichment)
    // ---------------------------------------------------------
    const { finishReason, groundingChunks, textOut } = extractTextAndChunks(response);

    if (finishReason === "SAFETY") {
      return new Response(JSON.stringify({ error: "Güvenlik Engeli", blocked: true }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Grounding chunk'lardan dosya isimlerini bulup zenginleştirme
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

      // Metadata fetch (Dosya adlarını UI'da göstermek için)
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
              documentMetadataMap[rawId] = filenameMeta.stringValue || filenameMeta.value || rawId;
            }
          }
        } catch (e) {
          console.error(`Meta fetch error ${rawId}`, e);
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
