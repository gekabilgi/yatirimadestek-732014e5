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

// -------------------- MAIN EDGE FUNCTION --------------------

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

    // -------------------- INCENTIVE QUERY STATE --------------------
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

        // 1) sektor → 2) il → 3) ilçe → 4) OSB
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
        // Yeni kayıt: ilk mesajı SEKTÖR olarak kaydet
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
      // session yoksa bile mantıksal bir collecting obje
      incentiveQuery = {
        status: "collecting",
        sector: lastUserMessage.content,
        province: null,
        district: null,
        osb_status: null,
      };
    }

    const normalizedUserMessage = normalizeRegionNumbers(lastUserMessage.content);

    // -------------------- DETERMINISTIK COLLECTING MODU --------------------

    const isCollecting = isIncentiveRelated && incentiveQuery && incentiveQuery.status === "collecting";

    if (isCollecting) {
      console.log("➡ Collecting mode, no Gemini call. incentiveQuery:", incentiveQuery);

      let text = "";
      const sector = incentiveQuery.sector?.trim();
      const province = incentiveQuery.province?.trim();
      const district = incentiveQuery.district?.trim();
      const osbStatus = incentiveQuery.osb_status?.trim();

      // Hangi adımdayız?
      if (!sector) {
        // Neredeyse imkânsız ama fallback
        text = "Özet: Yatırım fikrinizi anlıyorum.\nSoru: Hangi alanda (sektörde) yatırım yapmayı planlıyorsunuz?";
      } else if (!province) {
        text =
          `Özet: "${sector}" alanında yatırım yapmak istediğinizi anlıyorum.\n` +
          `Soru: Bu yatırımı Türkiye'nin hangi ilinde yapmayı planlıyorsunuz?`;
      } else if (!district) {
        text =
          `Özet: "${sector}" yatırımı için ${province} ilini düşündüğünüzü anlıyorum.\n` +
          `Soru: Bu yatırımı ${province} ilinin hangi ilçesinde yapmayı planlıyorsunuz?`;
      } else if (!osbStatus) {
        text =
          `Özet: "${sector}" yatırımı için ${province} ili ${district} ilçesini düşündüğünüzü anladım.\n` +
          `Soru: Yatırımı Organize Sanayi Bölgesi (OSB) veya Endüstri Bölgesi İÇİNDE mi, DIŞINDA mı yapmayı planlıyorsunuz? (Lütfen "OSB içi" veya "OSB dışı" şeklinde belirtin.)`;
      } else {
        // Tüm bilgiler dolu ama status hâlâ collecting ise (senkron problemi varsa)
        text =
          "Özet: Yatırımınız için temel bilgileri aldım.\n" +
          "Soru: İsterseniz şimdi yatırımınız için hangi teşviklerden yararlanabileceğinizi birlikte inceleyelim; özel bir sorunuz var mı?";
      }

      return new Response(
        JSON.stringify({
          text,
          groundingChunks: [],
          mode: "collecting",
          incentiveQuery,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // -------------------- ANSWER MODE (Gemini + File Search) --------------------

    const ai = getAiClient();

    const baseInstructions = `
Sen Türkiye’de yatırım teşvik sistemi ve ilgili finansman araçlarına (özellikle 9903 sayılı Karar, 2025/1 Tebliğ, Yerel Yatırım Konuları Tebliği ve YTAK) hâkim, profesyonel bir yatırım teşvik danışmanısın.

KULLANDIĞIN KAYNAKLAR:
- "ykh_teblig_yatirim_konulari_listesi_yeni.pdf": Yerel Kalkınma Hamlesi yerel yatırım konuları, il-il ürün bazlı liste.
- "9903_kararr.pdf" / "9903_karar.pdf": Genel teşvik sistemi, bölgeler, asgari yatırım tutarları, destek unsurları.
- "2025-1-9903_teblig.pdf": Başvuru süreci, E-TUYS, tamamlama vizesi, ÇED/SGK, desteklerin uygulama usulü.
- "2016-9495_Proje_Bazli.pdf" + "2019-1_9495_teblig.pdf": Proje bazlı (süper) teşvik sistemi.
- "HIT30.pdf": HIT-30 yüksek teknoloji yatırım alanları.
- "ytak.pdf": TCMB YTAK Uygulama Talimatı (kural metni).
- "ytak_hesabi.pdf": YTAK faiz hesaplama örneği.
- "sectorsearching.xlsx": NACE kodu – sektör eşlemesi.
- "etuys_systemsel_sorunlar.txt": E-TUYS sistemsel hatalar ve çözümleri.

KURAL:
- Yerel yatırım konuları için yalnızca YKH listesine dayan.
- Bölge numarası, asgari yatırım, destek unsurları için 9903 Karar + eklerini kullan.
- Başvuru ve süreç detayları için 2025/1 Tebliğ’e bak.
- YTAK ile ilgili hesap ve kurallar için ytak.pdf ve ytak_hesabi.pdf’i esas al.
- Dokümandan uzun paragraf kopyalama, kendi cümlelerinle özetle.
- Cevaba her zaman kısa bir özet paragraf ile başla, gerekiyorsa madde madde detaylandır.
`;

    const augmentedUserMessage = `
Kullanıcının sorusu: "${normalizedUserMessage}"

Görev:
1. Gerekli olduğunda File Search kullanarak yukarıdaki dokümanlarda ara.
2. İlgili belgelerde bulduğun somut hükümlere dayanarak yanıt üret.
3. Eğer bir ürün (ör. inülin) doğrudan listede yoksa, bunu açıkça söyle; üst kategoride değerlendirme yapıyorsan bunu da "yorum" olduğunu belirterek ifade et.
4. Özellikle "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" içinde ürünün geçtiği tüm illeri eksiksiz bul ve listele.
`;

    const messagesForGemini = [
      ...messages.slice(0, -1),
      {
        ...lastUserMessage,
        content: augmentedUserMessage,
      },
    ];

    const generationConfig = {
      temperature: 0.1,
      maxOutputTokens: 4096,
    };

    console.log("➡ Answer mode, calling Gemini with File Search");

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: messagesForGemini.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      config: {
        ...generationConfig,
        systemInstruction: baseInstructions,
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
      finishReason,
      textPreview: textOut.substring(0, 200),
    });

    if (!textOut || textOut.trim().length === 0) {
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

    const result = {
      text: textOut,
      groundingChunks: groundingChunks ?? [],
      mode: "answer",
      incentiveQuery,
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
