maimport { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ... (getAiClient, getSupabaseAdmin ve diğer yardımcı fonksiyonlar... )
// ... (Bunlar doğru, o yüzden tekrar eklemiyorum)
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
    'birinci bölge': '1. Bölge',
    'ikinci bölge': '2. Bölge', 
    'üçüncü bölge': '3. Bölge',
    'dördüncü bölge': '4. Bölge',
    'beşinci bölge': '5. Bölge',
    'altıncı bölge': '6. Bölge',
    'altinci bölge': '6. Bölge',
    'birinci bölgedeli': '1. Bölge',
    'ikinci bölgedeli': '2. Bölge',
    'üçüncü bölgedeli': '3. Bölge',
    'dördüncü bölgedeli': '4. Bölge',
    'beşinci bölgedeli': '5. Bölge',
    'altıncı bölgedeli': '6. Bölge',
    'altinci bölgedeli': '6. Bölge',
  };

  let normalized = text;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(pattern, 'gi');
    normalized = normalized.replace(regex, replacement);
  }
  
  return normalized;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // <<< DEĞİŞİKLİK: Bu bayrak, zamanlama hatasını (off-by-one) düzeltmek için kritik
  let isNewQueryTrigger = false;
  // >>> DEĞİŞİKLİK

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
      "çorap", // <<< DEĞİŞİKLİK: Daha hızlı tetiklenmesi için eklendi
      "gömlek", // <<< DEĞİŞİKLİK: Daha hızlı tetiklenmesi için eklendi
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
        .eq("status", "collecting") // Sadece 'collecting' olanı al
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
      isNewQueryTrigger = true; // Bu bir tetikleyici istek

      if (sessionId) {
        const { data: newQuery, error: insertError } = await supabaseAdmin
          .from("incentive_queries")
          .insert({
            session_id: sessionId,
            status: "collecting",
            sector: null, // Sektör BOŞ başlamalı
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
          sector: null, // Sektör BOŞ başlamalı
          province: null,
          district: null,
          osb_status: null,
        };
        console.log("Started in-memory incentive query (no sessionId):", incentiveQuery);
      }
    }

    const ai = getAiClient();

    // ... (getSlotFillingStatus ve getNextSlotToFill fonksiyonları aynı) ...
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

    // <<< DEĞİŞİKLİK: systemInstruction MANTIĞI TAMAMEN YENİLENDİ

    // Genel (normal RAG) talimatlar
    const baseInstructions = `
Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
Kullanıcılara yatırım destekleri, teşvik programları ve ilgili konularda yardımcı oluyorsun.
Özel Kurallar:
- 9903 sayılı karar, yatırım teşvikleri hakkında genel bilgiler, destek unsurları soruları, tanımlar, müeyyide, devir, teşvik belgesi revize, tamamlama vizesi ve mücbir sebep gibi idari süreçler vb. kurallar ve şartlarla ilgili soru sorulduğunda sorunun cevaplarını mümkün mertebe "9903_Sayılı_Karar.pdf" dosyasında ara.
- 9903 sayılı kararın uygulama usul ve esasları niteliğinde tebliğ, Teşvik belgesi başvaru şartları, yöntemi ve gerekli belgeler, Hangi yatırım türlerinin (komple yeni, tevsi, modernizasyon vb.) ve harcamaların destek kapsamına alınacağı, Özel sektör projeleri için stratejik hamle programı değerlendirme kriterleri ve süreci, Güneş, rüzgar enerjisi, veri merkezi, şarj istasyonu gibi belirli yatırımlar için ek şartlar, Faiz/kâr payı, sigorta primi, vergi indirimi gibi desteklerin ödeme ve uygulama esasları sorulduğunda sorunun cevaplarını mümkün mertebe "2025-1-9903_teblig.pdf" dosyasında ara.
- 9495 sayılı karar kapsamında proje bazlı yatırımlar, çok büyük ölçekli yatırımlar hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2016-9495_Proje_Bazli.pdf" dosyasında ara.
- 9495 sayılı kararın uygulanmasına yönelik usul ve esaslarla ilgili tebliğ için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2019-1_9495_teblig.pdf" dosyasında ara.
- HIT 30 programı kapsamında elektrikli araç, batarya, veri merkezleri ve alt yapıları, yarı iletkenlerin üretimi, Ar-Ge, kuantum, robotlar vb. yatırımları için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "Hit30.pdf" dosyasında ara.
- yatırım taahhütlü avans kredisi, ytak hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "ytak.pdf" ve "ytak_hesabi.pdf" dosyalarında ara.
- 9903 saylı karar ve karara ilişkin tebliğde belirlenmemiş "teknoloji hamlesi programı" hakkında programın uygulama esaslarını, bağımsız değerlendirme süreçleri netleştirilmiş ve TÜBİTAK'ın Ar-Ge bileşenlerini değerlendirme rolü, Komite değerlendirme kriterleri, başvuruları hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "teblig_teknoloji_hamlesi_degisiklik.pdf" dosyasında ara.
- Yerel kalkınma hamlesi, yerel yatırım konuları gibi ifadelerle soru sorulduğunda, yada Pektin yatırımını nerde yapabilirim gibi sorular geldiğinde sorunun cevaplarını mümkün mertebe "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında ara.
`;

    // İnteraktif mod (slot-filling) için talimatlar
    const interactiveInstructions = `
Sen bir yatırım teşvik danışmanısın. ŞU AN BİLGİ TOPLAMA MODUNDASIN.
"tesvik_sorgulama.pdf" dosyasındaki "SÜREÇ AKIŞI" [kaynak 62-71] ve "Örnek Akış"a [kaynak 89-100] harfiyen uymalısın.

⚠️ KRİTİK KURALLAR (PDF'e GÖRE):
1.  **AKILLI ANALİZ:** Kullanıcı "çorap üretimi" [kaynak 90] veya "linyit tesisi" gibi bir ifade kullanırsa, sektörü bu olarak anla ve BİR SONRAKİ SORUYA geç ("Hangi ilde?" [kaynak 92]).
2.  **GENEL SORU:** Eğer kullanıcı sadece "yatırım yapmak istiyorum" gibi genel bir ifade kullanırsa, "Hangi sektörde?" [kaynak 64] diye sor.
3.  **TEK SORU:** Her seferinde SADECE TEK BİR soru sor.
4.  **KISA CEVAP:** Maksimum 2 cümle kullan. (1. Onay, 2. Soru).
5.  **YASAK:** Genel bilgi VERME, uzun açıklama YAPMA. Rasgele kaydaklar dışında cevap ÜRETME. Sadece Kaynaklara bağlı KAL.

${incentiveSlotFillingInstruction}
`;

    // Ana talimatlar (her zaman geçerli)
    const fundamentalRules = `
İnteraktif Görüşme Kuralları (Hesaplama):
Yüklediğim "tesvik_sorgulama.pdf" dosyasında yer alan "TEMEL KURALLAR" [kaynak 1], "VERİ KAYNAKLARI" [kaynak 46] ve "SÜREÇ AKIŞI" [kaynak 59] başlıkları altında verilen bilgilere dayanarak: 
1. Adım adım mantık yürüterek bu yatırımın hangi destek kategorisine girdiğini bul (Önce 6. Bölge Kuralını kontrol et [kaynak 5, 84]).
2. İstanbul ve GES/RES istisnalarını kontrol et [kaynak 35, 40, 43, 85].
3. Alacağı destekleri (Faiz, Vergi İndirimi, SGK Süresi, Alt Bölge, KDV, Gümrük) hesapla [kaynak 86].
4. Sonucu bana detaylı bir rapor olarak sun [kaynak 87].

Temel Kurallar:
- Türkçe konuş ve profesyonel bir üslup kullan.
- Mümkün olduğunca kısa, anlaşılır ve net cevap ver.
- ÖNEMLİ: Dokümanlardaki bilgileri kendi cümlelerinle "**bağlamdan kopmadan**" yeniden ifade et.
- Sorulan soruda geçen terimleri tüm dokümanın tamamında ara ve bilgileri birleştirerek "**bağlamdan kopmadan**" mantıklı bir açıklama yap.
- Cevap sonunda konuyla ilgili daha detaylı sorunuz olursa doğrudan ilgili yatırım destek ofisi uzmanlarına soru sorabilirsiniz.
- Son olarak konu dışında küfürlü ve hakaret içeren sorular gelirse karşılık verme sadece görevini söyle.

Bölge Numaraları (ÖNEMLİ):
- Kullanıcı "1. Bölge", "2. Bölge", "3. Bölge", "4. Bölge", "5. Bölge", "6. Bölge" ifadelerini kullanır
- 6. Bölge, Türkiye'deki en yüksek teşvik bölgesidir (en fazla destek sağlanır)
- Her bölgenin farklı vergi indirim oranı, SGK primi desteği ve faiz desteği vardır
- Bölge numarasını ASLA karıştırma! Örneğin "6. Bölge" dediğinde MUTLAKA 6. Bölge bilgilerini kullan, başka bölge bilgisi verme`;
    // Duruma göre hangi talimatın kullanılacağını seç
    const systemInstruction =
      incentiveQuery && incentiveQuery.status === "collecting"
        ? interactiveInstructions + fundamentalRules // BİLGİ TOPLAMA MODU (Akıllı kurallar + Temel kurallar)
        : baseInstructions + fundamentalRules; // NORMAL MOD (Dosyalar + Temel kurallar)

    // >>> DEĞİŞİKLİK BURADA BİTTİ

    // 3) GUARDRAIL: Slot toplama modundaysak ve EKSİK slot varsa
    // <<< DEĞİŞİKLİK: BU BLOK, İLK TETİKLEYİCİ MESAJDA ÇALIŞMAMALI!
    if (incentiveQuery && incentiveQuery.status === "collecting" && !isNewQueryTrigger) {
      // >>> DEĞİŞİKLİK

      const hasAllSlots =
        incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;

      // Bu blok, "çorap" mesajından sonra "Hangi ilde?" diye sorulduğunda,
      // "Adana" cevabını işlemek için çalışacaktır.
      if (!hasAllSlots) {
        console.log("⚡ GUARDRAIL: Deterministic slot filling (NOT first message)");

        const rawLastUserMessage = messages.filter((m: any) => m.role === "user").slice(-1)[0]?.content || "";
        const normalizedMessage = rawLastUserMessage.trim();

        const updates: any = {};

        // ÖNEMLİ: isNewQueryTrigger 'false' olduğu için bu bloğun çalışması GÜVENLİDİR.
        // Bu, LLM'in ilk sorusuna ("Hangi ilde?") verilen cevabı ("Adana") işler.

        if (!incentiveQuery.sector && normalizedMessage) {
          // LLM'in ilk mesajı kaçırması durumunda (normalde olmamalı)
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

    // 4) Artık ya:
    //   - a) Slot toplama tamamlandı (status: completed) -> LLM ile detaylı teşvik hesabı
    //   - b) Hiç yatırım modu yok -> normal RAG cevabı
    //   - c) YENİ DURUM: isNewQueryTrigger = true -> İlk "akıllı" soru sorma

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

    // ... (Kalan tüm kodunuz - response handling, error catching - hepsi doğru) ...
    // ... (Değişiklik yok) ...

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

    // <<< DEĞİŞİKLİK: LLM'in cevabına göre 'sector' alanını GÜNCELLE
    // Bu, LLM'in "Hangi ilde?" diye sorduğu ilk akıllı cevaptan SONRA çalışır
    if (isNewQueryTrigger && sessionId && incentiveQuery) {
      // LLM'in "Hangi ilde?" diye sorduğunu varsayıyoruz,
      // bu, 'lastUserMessage'in Sektör olarak KABUL EDİLDİĞİ anlamına gelir.
      const inferredSector =
        messages.filter((m: any) => m.role === "user").slice(-1)[0]?.content || "Bilinmeyen Sektör";

      try {
        await supabaseAdmin.from("incentive_queries").update({ sector: inferredSector }).eq("id", incentiveQuery.id);
        console.log(`✓ Updated sector to "${inferredSector}" after LLM's first pass.`);
      } catch (dbError) {
        console.error("Error updating sector after LLM pass:", dbError);
      }
    }
    // >>> DEĞİŞİKLİK

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
