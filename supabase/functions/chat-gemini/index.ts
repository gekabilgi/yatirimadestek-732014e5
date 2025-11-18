import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Yardımcı Fonksiyonlar (Değişiklik yok) ---

function getAiClient(): GoogleGenAI {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  // DİKKAT: API Anahtarını doğrudan GoogleGenAI constructor'ına vermek
  // 'google/genai' kütüphanesinin son sürümlerinde (v1+)
  // new GoogleGenAI(apiKey) şeklindedir.
  // Eğer v0.x kullanıyorsanız { apiKey } doğrudur.
  // npm:@google/genai@1.29.1 versiyonu için new GoogleGenAI(apiKey) daha doğru olabilir.
  // Ancak kodunuzda { apiKey } vardı, onu koruyorum.
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
    "birinci bölgedeki": "1. Bölge",
    "ikinci bölgedeki": "2. Bölge",
    "üçüncü bölgedeki": "3. Bölge",
    "dördüncü bölgedeki": "4. Bölge",
    "beşinci bölgedeki": "5. Bölge",
    "altıncı bölgedeki": "6. Bölge",
    "altinci bölgedeki": "6. Bölge",
  };

  let normalized = text;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(pattern, "gi");
    normalized = normalized.replace(regex, replacement);
  }

  return normalized;
};

// --- Slot Doldurma Yardımcıları (Değişiklik yok) ---
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

// <<< DEĞİŞİKLİK: Sistem Talimatları (System Instructions) KÖKTEN YENİLENDİ ---

/**
 * Normal, RAG tabanlı cevaplar için talimatlar.
 * Modelin GÖREVİ: fileSearch ile bulunan dokümanları kullanarak cevap vermek.
 */
const createNormalRagInstructions = (): string => {
  return `
Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
Görevin, kullanıcının sorularını, **sana \`fileSearch\` aracı tarafından sağlanan dokümanlardaki bilgilere dayanarak** yanıtlamaktır.

TEMEL KURALLAR:
1.  **KAYNAĞA BAĞLI KAL:** Cevapların SADECE \`fileSearch\` ile sana verilen dokümanlara dayanmalıdır.
2.  **YORUMLA, KOPYALAMA:** Bilgileri kendi cümlelerinle, anlaşılır bir dille özetle. Dokümanları doğrudan kopyalama. Bu, \`RECITATION\` hatasını önlemek için kritiktir.
3.  **NET FORMAT:** Cevaplarını mümkünse madde madde, net ve profesyonel bir dille sun.
4.  **BİLGİ YOKSA:** Eğer aranan bilgi sana verilen dokümanlarda yoksa, "Bu bilgi elimdeki dokümanlarda mevcut değil, lütfen farklı bir soru sorun." de. Kesinlikle tahmin yürütme.
5.  **TÜRKÇE VE PROFESYONEL:** Sadece Türkçe konuş. Konu dışı, küfürlü veya hakaret içeren sorulara cevap verme, sadece "Size yatırım teşvikleri konusunda yardımcı olabilirim." de.
`;
};

/**
 * İnteraktif bilgi toplama modu için talimatlar.
 * Modelin GÖREVİ: SADECE soru sormak.
 */
const createSlotFillingInstructions = (query: any): string => {
  return `
Sen bir yatırım teşvik danışmanısın. **ŞU AN SADECE BİLGİ TOPLAMA MODUNDASIN.**
Görevin, "tesvik_sorgulama.pdf" dosyasındaki "SÜREÇ AKIŞI" [kaynak 62-71] ve "Örnek Akış"a [kaynak 89-100] harfiyen uymaktır.

⚠️ KRİTİK KURALLAR (PDF'e GÖRE):
1.  **AKILLI ANALİZ:** Kullanıcı "çorap üretimi" [kaynak 90] gibi spesifik bir sektör verirse, bunu 'sektör' olarak kabul et ve BİR SONRAKİ SORUYA geç ('Hangi ilde?' [kaynak 92]).
2.  **GENEL SORU:** Kullanıcı 'yatırım yapmak istiyorum' derse, 'Hangi sektörde?' [kaynak 64] diye sor.
3.  **TEK SORU:** Her cevapta SADECE BİR SONRAKİ EKSİK BİLGİYİ sor.
4.  **KISA CEVAP:** Cevabın MAKSİMUM 2 CÜMLE olsun (Örn: 'Anladım. [SONRAKİ SORU]').
5.  **YASAK:** Genel teşvik bilgisi VERME. Uzun açıklama YAPMA. Sadece soru sor.

**Mevcut Durum:** ${getSlotFillingStatus(query)}
**Toplanan Bilgiler:**
${query.sector ? `✓ Sektör: ${query.sector}` : "○ Sektör: Bekleniyor"}
${query.province ? `✓ İl: ${query.property}` : "○ İl: Bekleniyor"}
${query.district ? `✓ İlçe: ${query.district}` : "○ İlçe: Bekleniyor"}
${query.osb_status ? `✓ OSB Durumu: ${query.osb_status}` : "○ OSB Durumu: Bekleniyor"}

**SONRAKİ ADIM:** ${getNextSlotToFill(query)}

${
  query.sector && query.province && query.district && query.osb_status
    ? `
**HESAPLAMA ZAMANI:**
Tüm bilgiler toplandı. Artık SADECE 'tesvik_sorgulama.pdf' dosyasındaki SÜREÇ AKIŞI'na [kaynak 72-73] göre teşvik hesabı yap.
Kullanıcıya detaylı bir rapor sun [kaynak 87].
`
    : ""
}
`;
};

// >>> DEĞİŞİKLİK BURADA BİTTİ ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let isNewQueryTrigger = false;

  try {
    const { storeName, messages, sessionId } = await req.json();

    console.log("chat-gemini: Processing request with storeName:", storeName, "sessionId:", sessionId);

    if (!storeName || !messages || !Array.isArray(messages)) {
      throw new Error("storeName and messages array are required");
    }

    const lastUserMessage =
      messages
        .filter((m: any) => m.role === "user")
        .slice(-1)[0]
        ?.content?.toLowerCase() || "";

    // Teşvik modunu tetikleme mantığı (Değişiklik yok)
    const incentiveKeywords = [
      "teşvik",
      "tesvik",
      "hesapla",
      "yatırım",
      "yatirım",
      "yatirim",
      "destek",
      "sektör",
      "sektor",
      "üretim",
      "uretim",
      "imalat",
      "çorap",
      "gömlek",
    ];
    const shouldStartIncentiveMode = incentiveKeywords.some((keyword) => lastUserMessage.includes(keyword));

    const supabaseAdmin = getSupabaseAdmin();

    // 1) Var olan incentive_query'yi yükle (Değişiklik yok)
    let incentiveQuery: any = null;

    if (sessionId) {
      const { data, error } = await supabaseAdmin
        .from("incentive_queries")
        .select("*")
        .eq("session_id", sessionId)
        .eq("status", "collecting")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error loading incentive query:", error);
      } else if (data) {
        incentiveQuery = data;
        console.log("Loaded incentive query state:", incentiveQuery);
      }
    }

    // 2) Henüz yoksa ve yatırım niyeti varsa -> yeni başlat (Değişiklik yok)
    if (!incentiveQuery && shouldStartIncentiveMode) {
      isNewQueryTrigger = true;

      if (sessionId) {
        const { data: newQuery, error: insertError } = await supabaseAdmin
          .from("incentive_queries")
          .insert({
            session_id: sessionId,
            status: "collecting",
            sector: null,
          })
          .select()
          .single();

        if (!insertError && newQuery) {
          incentiveQuery = newQuery;
          console.log("✓ Started new incentive query:", incentiveQuery);
        } else {
          console.error("Error starting incentive query:", insertError);
        }
      } else {
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
    }

    const ai = getAiClient();

    // <<< DEĞİŞİKLİK: systemInstruction seçimi YENİLENDİ
    // Duruma göre hangi talimatın kullanılacağını seç
    const systemInstruction =
      incentiveQuery && incentiveQuery.status === "collecting"
        ? createSlotFillingInstructions(incentiveQuery) // BİLGİ TOPLAMA MODU
        : createNormalRagInstructions(); // NORMAL RAG MODU
    // >>> DEĞİŞİKLİK BURADA BİTTİ

    // 3) GUARDRAIL: Slot toplama modundaysak ve EKSİK slot varsa (Değişiklik yok)
    if (incentiveQuery && incentiveQuery.status === "collecting" && !isNewQueryTrigger) {
      const hasAllSlots =
        incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;

      if (!hasAllSlots) {
        console.log("⚡ GUARDRAIL: Deterministic slot filling (NOT first message)");

        const rawLastUserMessage = messages.filter((m: any) => m.role === "user").slice(-1)[0]?.content || "";
        const normalizedMessage = rawLastUserMessage.trim();

        const updates: any = {};

        if (!incentiveQuery.sector && normalizedMessage) {
          updates.sector = normalizedMessage;
        } else if (incentiveQuery.sector && !incentiveQuery.province && normalizedMessage) {
          updates.province = cleanProvince(normalizedMessage);
        } else if (incentiveQuery.province && !incentiveQuery.district && normalizedMessage) {
          updates.district = cleanDistrict(normalizedMessage);
        } else if (incentiveQuery.district && !incentiveQuery.osb_status && normalizedMessage) {
          const osb = parseOsbStatus(normalizedMessage);
          if (osb) {
            updates.osb_status = osb;
          }
        }

        Object.assign(incentiveQuery, updates);

        if (sessionId && Object.keys(updates).length > 0) {
          await supabaseAdmin.from("incentive_queries").update(updates).eq("id", incentiveQuery.id);
          console.log("✓ Updated slots in DB:", updates);
        } else if (!sessionId && Object.keys(updates).length > 0) {
          console.log("Updated slots in memory only (no sessionId):", updates);
        }

        let deterministicResponse = "";
        const nowHasAllSlots =
          incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;

        if (nowHasAllSlots) {
          deterministicResponse = "Teşekkürler. Girdiğiniz bilgilerle teşvik hesaplamasını yapmaya hazırım.";
          if (sessionId && incentiveQuery.status === "collecting") {
            await supabaseAdmin.from("incentive_queries").update({ status: "completed" }).eq("id", incentiveQuery.id);
            console.log("✓ All slots filled - marked as completed");
          } else {
            incentiveQuery.status = "completed";
          }
        } else if (!incentiveQuery.sector) {
          deterministicResponse = "Anladım. Hangi sektörde yatırım yapacaksınız?";
        } else if (!incentiveQuery.province) {
          deterministicResponse = "Teşekkürler. Hangi ilde yatırım yapacaksınız?";
        } else if (!incentiveQuery.district) {
          deterministicResponse = "Tamam. Hangi ilçede? (Merkez için 'Merkez' yazabilirsiniz)";
        } else if (!incentiveQuery.osb_status) {
          deterministicResponse = "Anladım. OSB içinde mi dışında mı olacak?";
        }

        return new Response(
          JSON.stringify({
            text: deterministicResponse,
            groundingChunks: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 4) LLM'e gönderme (Değişiklik yok)
    console.log("Sending to LLM. isNewQueryTrigger:", isNewQueryTrigger, "Status:", incentiveQuery?.status);

    const contents = messages.map((m: any, index: number) => {
      const isLastUserMessage = m.role === "user" && index === messages.length - 1;
      return {
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: isLastUserMessage ? normalizeRegionNumbers(m.content) : m.content }],
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      config: {
        temperature: 0.9, // 0.9'dan daha düşük (örn: 0.5) RAG için daha güvenilir olabilir
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
            },
          },
        ],
      },
    });

    // 5) Yanıt işleme (Değişiklik yok)
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === "RECITATION" || finishReason === "SAFETY") {
      return new Response(
        JSON.stringify({
          error:
            "Üzgünüm, bu soruya güvenli bir şekilde cevap veremiyorum. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin.",
          blocked: true,
          reason: finishReason,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    if (groundingChunks.length > 0) {
      console.log("groundingChunks count:", groundingChunks.length);
      console.log("First chunk full structure:", JSON.stringify(groundingChunks[0], null, 2));
      console.log("Has web?:", !!groundingChunks[0].web);
      console.log("Has retrievedContext?:", !!groundingChunks[0].retrievedContext);
      console.log("retrievedContext.uri:", groundingChunks[0].retrievedContext?.uri);
    }

    let textOut = "";
    try {
      // @ts-ignore
      textOut = response.text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg?.includes("RECITATION") || msg?.includes("SAFETY")) {
        return new Response(
          JSON.stringify({
            error:
              "Üzgünüm, bu soruya güvenli bir şekilde cevap veremiyorum. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin.",
            blocked: true,
            reason: "RECITATION",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      throw e;
    }

    console.log("Final response:", {
      textLength: textOut.length,
      groundingChunksCount: groundingChunks.length,
    });

    // 6) İlk tetiklemeden sonra sektörü güncelleme (Değişiklik yok)
    if (isNewQueryTrigger && sessionId && incentiveQuery) {
      const inferredSector =
        messages.filter((m: any) => m.role === "user").slice(-1)[0]?.content || "Bilinmeyen Sektör";

      try {
        await supabaseAdmin.from("incentive_queries").update({ sector: inferredSector }).eq("id", incentiveQuery.id);
        console.log(`✓ Updated sector to "${inferredSector}" after LLM's first pass.`);
      } catch (dbError) {
        console.error("Error updating sector after LLM pass:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        text: textOut,
        groundingChunks,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in chat-gemini:", error);
    return new Response(JSON.stringify({ error: error?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
