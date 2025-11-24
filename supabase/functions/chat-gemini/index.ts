import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

const GEMINI_MODEL_NAME = "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// -------------------- HELPERS --------------------

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

// -------------------- EDGE FUNCTION --------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, messages, sessionId } = await req.json();
    console.log(`=== chat-gemini (${GEMINI_MODEL_NAME}) request ===`);
    console.log("sessionId:", sessionId);

    if (!storeName) throw new Error("storeName is required");
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages must be a non-empty array");
    }

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === "user");
    if (!lastUserMessage) throw new Error("No user message found");

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

        // ⭐ SIRALI DOLUM: 1) sector → 2) province → 3) district → 4) osb_status
        if (!incentiveQuery.sector) {
          incentiveQuery.sector = userContent; // ilk mesaj → sektör tanımı
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
        // ⭐ YENİ KAYIT: İlk teşvikli mesajı SEKTÖR olarak kaydet
        const { data: newQuery } = await supabase
          .from("incentive_queries")
          .insert({
            session_id: sessionId,
            status: "collecting",
            sector: lastUserMessage.content,
            province: null,
            district: null,
            osb_status: null,
          })
          .select()
          .single();
        if (newQuery) incentiveQuery = newQuery;
      }
    } else if (isIncentiveRelated && !sessionId) {
      // session yoksa da mantıksal bir collecting obje oluştur
      incentiveQuery = {
        status: "collecting",
        sector: lastUserMessage.content,
        province: null,
        district: null,
        osb_status: null,
      };
    }

    const ai = getAiClient();

    // -------------------- SYSTEM PROMPT --------------------

    const baseInstructions = `
Sen Türkiye’de yatırım teşvik sistemine ve ilgili finansman araçlarına (özellikle 9903 sayılı Karar ve YTAK) çok hâkim, profesyonel bir yatırım teşvik ve finansman danışmanısın. Amacın, kullanıcının yatırım fikrini netleştirerek, ilgili mevzuat ve dokümanlardan yola çıkarak doğru ve sade teşvik/fınansman bilgisini sunmak ve mümkün oldukça kullanıcıdan eksik kalan bilgileri akıllıca tamamlamaktır.

KULLANDIĞIN KAYNAKLAR (FILE SEARCH):
- "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" → Yerel yatırım konuları il-il ürün listesi
- "9903_kararr.pdf" / "9903_karar.pdf" → Genel teşvik rejimi, bölgeler, asgari yatırım, destek unsurları
- "2025-1-9903_teblig.pdf" → Başvuru usulü, E-TUYS, tamamlama vizesi, ÇED/SGK, uygulama detayları
- "2016-9495_Proje_Bazli.pdf" + "2019-1_9495_teblig.pdf" → Proje bazlı süper teşvik
- "HIT30.pdf" → HIT-30 kapsamındaki yüksek teknoloji yatırım alanları
- "ytak.pdf" → YTAK Uygulama Talimatı (kural metni)
- "ytak_hesabi.pdf" → YTAK faiz hesaplama örneği
- "sectorsearching.xlsx" → NACE ve sektör eşlemesi
- "etuys_systemsel_sorunlar.txt" → E-TUYS teknik hata ve çözüm notları

GENEL DOSYA STRATEJİSİ:
- Yerel yatırım konusu → YKH listesi PDF.
- Genel teşvik rejimi, bölge, destek unsurları → 9903 Karar + 2025/1 Tebliğ.
- Proje bazlı süper teşvik → 2016-9495 Karar + 2019-1 Tebliğ.
- HIT-30 → HIT30 PDF.
- YTAK → ytak.pdf + ytak_hesabi.pdf.
- E-TUYS teknik → etuys_systemsel_sorunlar.txt.
`;

    const interactiveInstructions = `
Sen uzman bir yatırım teşvik ve finansman danışmanısın. ŞU AN BİLGİ TOPLAMA MODUNDASIN.

Mevcut Durum (kullanıcıdan aldığın bilgiler): ${incentiveQuery ? JSON.stringify(incentiveQuery) : "Bilinmiyor"}

⚠️ ÇOK ÖNEMLİ:
- BİLGİ TOPLAMA MODUNDAYKEN
  - ASLA teşvik hesaplaması yapma,
  - ASLA il/ilçe için destek oranı, bölge numarası, hangi desteklerden yararlanır gibi analizler üretme,
  - ASLA YKH listesi veya 9903 içeriğini ayrıntılı şekilde tarayıp uzun açıklama yazma.
- Sadece:
  1) Kullanıcının verdiği bilgiyi 1 cümle ile kısaca özetle,
  2) SONRA tam olarak 1 (BİR) tane yeni soru sor.
- Cevabında “Özet:” + “Soru:” formatını kullanabilirsin, ama sorudan önce en fazla 1–2 cümlelik çok kısa bir onay dışında açıklama verme.

Temel referans akışın:
1) Sektör / yatırım konusu (ilk mesajda genellikle geldi varsay)
2) İl
3) İlçe
4) OSB / Endüstri Bölgesi içinde mi dışında mı
5) (Varsa) finansman tercihi / YTAK ihtiyacı

Her cevapta eksik olan SADECE BİR temel bilgiyi tamamlamaya çalış:
- Eğer sadece sektör biliniyorsa → İL sor.
- Sektör + il biliniyorsa → İLÇE sor.
- Sektör + il + ilçe biliniyorsa → OSB durumu sor.
- Sektör + il + ilçe + OSB biliniyorsa → o zaman teşvik hesabı moduna geçilebilir (bunu sistem dışı mantık yönetiyor).

ESNEKLİK:
- Eğer kullanıcı bu sırada “Kütahya kaçıncı bölge?”, “YTAK faizi nasıl hesaplanıyor?” gibi doğrudan bilgi sorarsa:
  - Kısaca (maksimum 2–3 cümle) cevap ver,
  - Ardından AKIŞ SORUSUNA geri dön (örneğin “Şimdi yatırımınızı hangi ilçede planlıyorsunuz?”).

SINIRLAR:
- Yerel yatırım konuları için asla 9903 Karar içinden il listeleriyle tahmin yapma; sadece YKH listesi PDF’ini kullan.
- Bölge numarası, asgari yatırım tutarı, destek oranı gibi konularda önce 9903 Karar’a, süreçle ilgili konularda 2025/1 Tebliğ’e başvur.
- YTAK faiz hesapları için 9903 değil, YTAK Talimatı + hesap örneğini temel al.

CEVAP FORMATIN (collecting modunda):
- Çok kısa bir özet + tek soru. Örneğin:
  “Özet: İnülin üretimi yatırımı düşündüğünüzü anlıyorum.
   Soru: Bu yatırımı hangi ilde yapmayı planlıyorsunuz?”
- Bu modda tablo, madde madde teşvik listesi, il/ilçe sayma gibi uzun analizler YAPMA.
`;

    const isCollecting = incentiveQuery?.status === "collecting";

    const systemPrompt = isCollecting ? baseInstructions + "\n\n" + interactiveInstructions : baseInstructions;

    const normalizedUserMessage = normalizeRegionNumbers(lastUserMessage.content);

    const augmentedUserMessage = `
${normalizedUserMessage}

(SİSTEM NOTU: Bu soruyu yanıtlarken File Search aracını kullan. 
Aradığın terimin eş anlamlılarını ve farklı yazılışlarını da sorguya dahil et.
Eğer bu konu birden fazla ilde, maddede veya listede geçiyorsa, HEPSİNİ eksiksiz listele.
Özetleme yapma; tüm sonuçları getir. Özellikle "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" içinde detaylı arama yap.)
`;

    // ⭐ Collecting modunda kullanıcı mesajını ŞİŞİRMİYORUZ
    const userContentForModel = isCollecting ? normalizedUserMessage : augmentedUserMessage;

    const messagesForGemini = [
      ...messages.slice(0, -1),
      {
        ...lastUserMessage,
        content: userContentForModel,
      },
    ];

    const generationConfig = {
      temperature: isCollecting ? 0.2 : 0.1,
      maxOutputTokens: isCollecting ? 512 : 8192, // collecting modunda kısa tut
    };

    console.log("=== Calling Gemini ===", {
      isCollecting,
      status: incentiveQuery?.status,
      incentiveQuery,
    });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: messagesForGemini
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }))
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

    const { finishReason, groundingChunks, textOut } = extractTextAndChunks(response);

    console.log("📊 Gemini response:", {
      isCollecting,
      finishReason,
      textPreview: textOut.substring(0, 160),
    });

    // Boş yanıt kontrolü (sadece cevap modunda)
    if ((!textOut || textOut.trim().length === 0) && !isCollecting) {
      console.warn("⚠️ Empty response in answer mode, returning fallback.");
      return new Response(
        JSON.stringify({
          text: "Üzgünüm, belgelerimde bu konuyla ilgili doğrudan bilgi bulamadım. Lütfen sorunuzu farklı kelimelerle ifade ederek tekrar deneyin veya ilgili Yatırım Destek Ofisi ile iletişime geçin.",
          groundingChunks: [],
          emptyResponse: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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

    // Dosya isimlerini zenginleştirme (kısa sürüm)
    let enrichedChunks: any[] = [];
    if (groundingChunks && groundingChunks.length > 0) {
      enrichedChunks = groundingChunks;
    }

    const result = {
      text: textOut,
      groundingChunks: enrichedChunks,
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
