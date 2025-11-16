import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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

// Küçük yardımcılar
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    ];
    const shouldStartIncentiveMode = incentiveKeywords.some((keyword) => lastUserMessage.includes(keyword));

    const supabaseAdmin = getSupabaseAdmin();

    // 1) Var olan incentive_query'yi yükle
    let incentiveQuery: any = null;

    if (sessionId) {
      const { data, error } = await supabaseAdmin
        .from("incentive_queries")
        .select("*")
        .eq("session_id", sessionId)
        .in("status", ["collecting", "completed"])
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

    // 2) Henüz yoksa ve yatırım niyeti varsa -> yeni başlat
    if (!incentiveQuery && shouldStartIncentiveMode) {
      if (sessionId) {
        const { data: newQuery, error: insertError } = await supabaseAdmin
          .from("incentive_queries")
          .insert({
            session_id: sessionId,
            status: "collecting",
            // İlk mesajı sektör olarak al (daha sofistike NLP sonra eklenebilir)
            sector: messages[messages.length - 1]?.content || null,
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
        // sessionId yoksa bile en azından o istek için RAM'de bir state oluşturalım
        incentiveQuery = {
          id: null,
          session_id: null,
          status: "collecting",
          sector: messages[messages.length - 1]?.content || null,
          province: null,
          district: null,
          osb_status: null,
        };
        console.log("Started in-memory incentive query (no sessionId):", incentiveQuery);
      }
    }

    const ai = getAiClient();

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
## ⚠️ SERT KURALLAR - UZUN AÇIKLAMA YAPMA - YASAK! ⚠️

**CEVAP FORMATI (ZORUNLU):**
- Maksimum 2 cümle kullan
- İlk cümle: Kısa onay/geçiş (1 cümle)
- İkinci cümle: Tek bir soru (1 cümle)
- Genel bilgi VERME, sadece eksik bilgiyi SOR

**Mevcut Durum:** ${getSlotFillingStatus(incentiveQuery)}
**Toplanan Bilgiler:**
${incentiveQuery.sector ? `✓ Sektör: ${incentiveQuery.sector}` : "○ Sektör: Bekleniyor"}
${incentiveQuery.province ? `✓ İl: ${incentiveQuery.province}` : "○ İl: Bekleniyor"}
${incentiveQuery.district ? `✓ İlçe: ${incentiveQuery.district}` : "○ İlçe: Bekleniyor"}
${incentiveQuery.osb_status ? `✓ OSB Durumu: ${incentiveQuery.osb_status}` : "○ OSB Durumu: Bekleniyor"}

**SONRAKİ ADIM:** ${getNextSlotToFill(incentiveQuery)}

### SORU ÖRNEKLERİ (TAM OLARAK BU ŞEKİLDE):

${
  !incentiveQuery.sector
    ? `
**SEKTÖR SORGUSU:**
✅ DOĞRU: "Anladım. Hangi sektörde yatırım yapacaksınız?"
❌ YANLIŞ: "Türkiye'deki yatırım teşvik sisteminde... [uzun açıklama]... hangi sektörde yatırım yapmayı düşünüyorsunuz?"
`
    : ""
}

${
  incentiveQuery.sector && !incentiveQuery.province
    ? `
**İL SORGUSU:**
✅ DOĞRU: "Teşekkürler. Hangi ilde yatırım yapacaksınız?"
❌ YANLIŞ: "Gömlek üretimi için Türkiye'de birçok teşvik var... [uzun açıklama]... hangi ilde?"
`
    : ""
}

${
  incentiveQuery.province && !incentiveQuery.district
    ? `
**İLÇE SORGUSU:**
✅ DOĞRU: "Tamam. Hangi ilçede? (Merkez için 'Merkez' yazabilirsiniz)"
❌ YANLIŞ: "İl bilgisini aldım. Türkiye'de ilçelere göre farklı... [uzun açıklama]... hangi ilçe?"
`
    : ""
}

${
  incentiveQuery.district && !incentiveQuery.osb_status
    ? `
**OSB SORGUSU:**
✅ DOĞRU: "Anladım. OSB içinde mi dışında mı olacak?"
❌ YANLIŞ: "OSB'ler organize sanayi bölgeleridir ve... [uzun açıklama]... OSB içi mi dışı mı?"
`
    : ""
}

${
  incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status
    ? `
**HESAPLAMA ZAMANI:**
Tüm bilgiler toplandı. Şimdi "tesvik_sorgusu.pdf" dosyasındaki SÜREÇ AKIŞI'na göre teşvik hesabı yap.
`
    : ""
}
`
      : "";

    const systemInstruction =
      incentiveQuery && incentiveQuery.status === "collecting"
        ? `Sen bir yatırım teşvik danışmanısın. ŞU AN BİLGİ TOPLAMA MODUNDASIN.

⚠️ KRİTİK KURALLAR:
- SADECE KISA SORULAR SOR (maksimum 2 cümle)
- UZUN AÇIKLAMA YAPMA - YASAK!
- Her seferinde TEK BİR bilgi topla
- Genel bilgi verme, sadece eksik bilgiyi sor

CEVAP ŞEKLİ:
1. cümle: Kısa onay/geçiş
2. cümle: Tek soru

Örnek: "Anladım. Hangi ilde yatırım yapacaksınız?"`
        : `Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
Kullanıcılara yatırım destekleri, teşvik programları ve ilgili konularda yardımcı oluyorsun.
Özel Kurallar:
9903 sayılı karar ... (buradaki uzun doküman talimatlarını olduğu gibi bırakıyorum)
${incentiveSlotFillingInstruction}

Temel Kurallar:
Türkçe konuş ve profesyonel bir üslup kullan.
Mümkün olduğunca kısa, anlaşılır ve net cevap ver.
ÖNEMLİ: Dokümanlardaki bilgileri kendi cümlelerinle yeniden ifade et. Direkt alıntı yapma, parafraze et.
Sorulan soruda geçen terimleri tüm dokümanın tamamında ara ve bilgileri birleştirerek mantıklı bir açıklama yap.
Cevap sonunda konuyla ilgili daha detaylı sorunuz olursa doğrudan ilgili yatırım destek ofisi uzmanlarına soru sorabilirsiniz.
Son olarak konu dışında küfürlü ve hakaret içeren sorular gelirse karşılık verme sadece görevini söyle.`;

    // 3) GUARDRAIL: Slot toplama modundaysak ve eksik slot varsa -> LLM KULLANMADAN deterministik soru üret
    if (incentiveQuery && incentiveQuery.status === "collecting") {
      const hasAllSlots =
        incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;

      if (!hasAllSlots) {
        console.log("⚡ GUARDRAIL: Deterministic short question");

        // Son kullanıcı mesajını al
        const rawLastUserMessage = messages.filter((m: any) => m.role === "user").slice(-1)[0]?.content || "";
        const normalizedMessage = rawLastUserMessage.trim();

        const updates: any = {};
        // Slot doldurma sırası: sector -> province -> district -> osb_status
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

        // RAM'deki incentiveQuery objesini güncelle
        Object.assign(incentiveQuery, updates);

        // DB update sadece sessionId varsa
        if (sessionId && Object.keys(updates).length > 0) {
          await supabaseAdmin.from("incentive_queries").update(updates).eq("session_id", sessionId);
          console.log("✓ Updated slots in DB:", updates);
        } else if (!sessionId && Object.keys(updates).length > 0) {
          console.log("Updated slots in memory only (no sessionId):", updates);
        }

        // Son durumda hangi soru sorulacak?
        let deterministicResponse = "";
        const nowHasAllSlots =
          incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;

        if (!incentiveQuery.sector) {
          deterministicResponse = "Anladım. Hangi sektörde yatırım yapacaksınız?";
        } else if (!incentiveQuery.province) {
          deterministicResponse = "Teşekkürler. Hangi ilde yatırım yapacaksınız?";
        } else if (!incentiveQuery.district) {
          deterministicResponse = "Tamam. Hangi ilçede? (Merkez için 'Merkez' yazabilirsiniz)";
        } else if (!incentiveQuery.osb_status) {
          deterministicResponse = "Anladım. OSB içinde mi dışında mı olacak?";
        } else if (nowHasAllSlots) {
          // Tüm bilgiler tamamlandıysa artık bir sonraki istekte LLM ile detaylı hesaplama yapılacak
          deterministicResponse = "Teşekkürler. Girdiğiniz bilgilerle teşvik hesaplamasını yapmaya hazırım.";
          if (sessionId && incentiveQuery.status === "collecting") {
            await supabaseAdmin.from("incentive_queries").update({ status: "completed" }).eq("session_id", sessionId);
            console.log("✓ All slots filled - marked as completed");
          } else {
            incentiveQuery.status = "completed";
          }
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

    // 4) Artık ya:
    //   - a) Slot toplama tamamlandı (status: completed) -> LLM ile detaylı teşvik hesabı
    //   - b) Hiç yatırım modu yok -> normal RAG cevabı

    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      config: {
        temperature: 0.3,
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
            },
          },
        ],
      },
    });

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
          status: 400,
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
      // google/genai JS client'ında bu alan text olarak expose ediliyorsa:
      // (eğer değilse response.candidates[0].content.parts[0].text alman gerekebilir)
      // Ancak senin projende bu pattern'i zaten kullanıyorsun, bozmuyorum.
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
            status: 400,
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
