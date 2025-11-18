import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

// Gemini yanıtından metin + grounding parçalarını güvenli çıkar
function extractTextAndChunks(response: any) {
  const candidate = response?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const parts = candidate?.content?.parts ?? [];
  const textOut = parts.map((p: any) => p.text ?? "").join("");
  return { finishReason, groundingChunks, textOut };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // İlk tetikleyici mesajı (yatırım modu başlangıcı) ayırt etmek için
  let isNewQueryTrigger = false;

  try {
    const { storeName, messages, sessionId } = await req.json();

    console.log(
      "chat-gemini: Processing request with storeName:",
      storeName,
      "sessionId:",
      sessionId,
    );

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
      "çorap",
      "gömlek",
    ];
    const shouldStartIncentiveMode = incentiveKeywords.some((keyword) =>
      lastUserMessage.includes(keyword),
    );

    const supabaseAdmin = getSupabaseAdmin();

    // 1) Var olan incentive_query'yi yükle
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

    // 2) Henüz yoksa ve yatırım niyeti varsa -> yeni başlat
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

    // Genel (normal RAG) talimatlar
    const baseInstructions = `
Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
Tüm cevaplarını mümkün olduğunca YÜKLEDİĞİN BELGELERE dayanarak ver.
Belge içeriğiyle çelişen veya desteklenmeyen genellemeler yapma; gerekirse "Bu soru belgelerin kapsamı dışında" de.

Özel Kurallar:
- 9903 sayılı karar, yatırım teşvikleri hakkında genel bilgiler, destek unsurları soruları, tanımlar, müeyyide, devir, teşvik belgesi revize, tamamlama vizesi ve mücbir sebep gibi idari süreçler vb. kurallar ve şartlarla ilgili soru sorulduğunda sorunun cevaplarını mümkün mertebe "9903_Sayılı_Karar.pdf" dosyasında ara.
- 9903 sayılı kararın uygulama usul ve esasları niteliğinde tebliğ, teşvik belgesi başvuru şartları, yöntemi ve gerekli belgeler, hangi yatırım türlerinin (komple yeni, tevsi, modernizasyon vb.) ve harcamaların destek kapsamına alınacağı, özel sektör projeleri için stratejik hamle programı değerlendirme kriterleri ve süreci, güneş, rüzgar enerjisi, veri merkezi, şarj istasyonu gibi belirli yatırımlar için ek şartlar, faiz/kâr payı, sigorta primi, vergi indirimi gibi desteklerin ödeme ve uygulama esasları sorulduğunda sorunun cevaplarını mümkün mertebe "2025-1-9903_teblig.pdf" dosyasında ara.
- 9495 sayılı karar kapsamında proje bazlı yatırımlar, çok büyük ölçekli yatırımlar hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2016-9495_Proje_Bazli.pdf" dosyasında ara.
- 9495 sayılı kararın uygulanmasına yönelik usul ve esaslarla ilgili tebliğ için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2019-1_9495_teblig.pdf" dosyasında ara.
- HIT 30 programı kapsamında elektrikli araç, batarya, veri merkezleri ve alt yapıları, yarı iletkenlerin üretimi, Ar-Ge, kuantum, robotlar vb. yatırımları için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "Hit30.pdf" dosyasında ara.
- Yatırım taahhütlü avans kredisi, YTAK hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "ytak.pdf" ve "ytak_hesabi.pdf" dosyalarında ara.
- 9903 sayılı karar ve karara ilişkin tebliğde belirlenmemiş "teknoloji hamlesi programı" hakkında programın uygulama esaslarını, bağımsız değerlendirme süreçleri netleştirilmiş ve TÜBİTAK'ın Ar-Ge bileşenlerini değerlendirme rolü, Komite değerlendirme kriterleri, başvuruları hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "teblig_teknoloji_hamlesi_degisiklik.pdf" dosyasında ara.
- Yerel kalkınma hamlesi, yerel yatırım konuları gibi ifadelerle soru sorulduğunda, ya da pektin yatırımını nerede yapabilirim gibi sorular geldiğinde sorunun cevaplarını mümkün mertebe "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında ara.
- Eğer yüklenen belgeler soruyu kapsamıyorsa "Bu soru yüklenen belgelerin kapsamı dışında, sadece genel kavramsal açıklama yapabilirim." diye belirt ve genel kavramı çok kısa özetle.
`;

    // İnteraktif mod (slot-filling) talimatları
    const interactiveInstructions = `
Sen bir yatırım teşvik danışmanısın. ŞU AN BİLGİ TOPLAMA MODUNDASIN.

"tesvik_sorgulama.pdf" dosyasındaki "SÜREÇ AKIŞI" [kaynak 62-71] ve "Örnek Akış"a [kaynak 89-100] harfiyen uymalısın.

⚠️ KRİTİK KURALLAR (PDF'e GÖRE):
1.  AKILLI ANALİZ: Kullanıcı "çorap üretimi" [kaynak 90] veya "linyit tesisi" gibi bir ifade kullanırsa, sektörü bu olarak anla ve BİR SONRAKİ SORUYA geç ("Hangi ilde?" [kaynak 92]).
2.  GENEL SORU: Eğer kullanıcı sadece "yatırım yapmak istiyorum" gibi genel bir ifade kullanırsa, "Hangi sektörde?" [kaynak 64] diye sor.
3.  TEK SORU: Her seferinde SADECE TEK BİR soru sor.
4.  KISA CEVAP
