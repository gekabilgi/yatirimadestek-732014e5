import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

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

// FIX 1: Robustly filter out internal tool and thought content (tool call leakage).
function extractTextAndChunks(response: any) {
  const candidate = response?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const parts = candidate?.content?.parts ?? []; // Iterate over parts and only collect the 'text' property.
  // This explicitly filters out internal 'toolCall', 'executableCode', 'codeExecutionResult', and 'thought' blocks.
  const textOut = parts
    .map((p: any) => p.text)
    .filter((text: string | undefined) => typeof text === "string")
    .join("");
  return { finishReason, groundingChunks, textOut };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, messages, sessionId } = await req.json();
    console.log("=== chat-gemini request ===");
    console.log("storeName:", storeName);
    console.log("sessionId:", sessionId);
    console.log("messages count:", messages?.length);

    if (!storeName) {
      throw new Error("storeName is required");
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages must be a non-empty array");
    }

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === "user");
    if (!lastUserMessage) {
      throw new Error("No user message found");
    }

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

    console.log("isIncentiveRelated:", isIncentiveRelated);

    const supabase = getSupabaseAdmin();
    let incentiveQuery: any = null;

    if (isIncentiveRelated && sessionId) {
      const { data: existingQuery, error: queryError } = await supabase
        .from("incentive_queries")
        .select()
        .eq("session_id", sessionId)
        .maybeSingle();

      if (queryError) {
        console.error("Error checking incentive_queries:", queryError);
      }

      if (existingQuery) {
        incentiveQuery = existingQuery;
        console.log("✓ Found existing incentive query:", incentiveQuery);

        const userContent = lastUserMessage.content;
        let updated = false;

        // Note: The slot filling logic below is sequential and prone to the "greedy" problem.
        // It's left as is to match your original structure, but the prompt fixes
        // and history cleanup should make the chatbot's *output* cleaner.
        if (!incentiveQuery.sector) {
          incentiveQuery.sector = userContent;
          updated = true;
        } else if (!incentiveQuery.province) {
          const province = cleanProvince(userContent);
          incentiveQuery.province = province;
          updated = true;
        } else if (!incentiveQuery.district) {
          const district = cleanDistrict(userContent);
          incentiveQuery.district = district;
          updated = true;
        } else if (!incentiveQuery.osb_status) {
          const osbStatus = parseOsbStatus(userContent);
          if (osbStatus) {
            incentiveQuery.osb_status = osbStatus;
            updated = true;
          }
        }

        if (updated && incentiveQuery.id) {
          const allFilled =
            incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status;
          const newStatus = allFilled ? "complete" : "collecting";

          const { error: updateError } = await supabase
            .from("incentive_queries")
            .update({
              sector: incentiveQuery.sector,
              province: incentiveQuery.province,
              district: incentiveQuery.district,
              osb_status: incentiveQuery.osb_status,
              status: newStatus,
            })
            .eq("id", incentiveQuery.id);

          if (updateError) {
            console.error("Error updating incentive_queries:", updateError);
          } else {
            incentiveQuery.status = newStatus;
            console.log("✓ Updated incentive query:", incentiveQuery);
          }
        }
      } else {
        const { data: newQuery, error: insertError } = await supabase
          .from("incentive_queries")
          .insert({
            session_id: sessionId,
            status: "collecting",
            sector: null,
            province: null,
            district: null,
            osb_status: null,
          })
          .select()
          .single();

        if (!insertError && newQuery) {
          incentiveQuery = newQuery;
          console.log("✓ Started new incentive query:", incentiveQuery);
        } else {
          console.error("Error starting incentive query:", insertError);
        }
      }
    } else if (isIncentiveRelated && !sessionId) {
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

    const ai = getAiClient();

    const generationConfig = {
      temperature: 1.0,
      maxOutputTokens: 8192,
    };

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
## ⚠️ MOD VE KURALLAR ⚠️

**DURUM:** Şu an yatırımcıdan eksik bilgileri topluyorsun.
**MEVCUT İLERLEME:** ${getSlotFillingStatus(incentiveQuery)}

**CEVAP STRATEJİSİ (ÖNEMLİ):**
1. **Eğer Kullanıcı Soru Sorduysa:** (Örn: "Kütahya hangi bölgede?", "KDV istisnası nedir?")
   - **ÖNCE CEVAPLA:** Yüklenen belgelerden (Karar ekleri, il listeleri vb.) cevabı bul ve kullanıcıya ver.
   - **SONRA DEVAM ET:** Cevabın hemen ardından, eksik olan sıradaki bilgiyi sor.
   - *Örnek:* "Kütahya ili genel teşvik sisteminde 4. bölgede yer almaktadır. Peki yatırımınızı hangi ilçede yapmayı planlıyorsunuz?"

2. **Eğer Kullanıcı Sadece Veri Verdiyse:** (Örn: "Tekstil", "Ankara")
   - Kısa bir onay ver ve sıradaki eksik bilgiyi sor.
   - Maksimum 2 cümle kullan.

**Toplanan Bilgiler:**
${incentiveQuery.sector ? `✓ Sektör: ${incentiveQuery.sector}` : "○ Sektör: Bekleniyor"}
${incentiveQuery.province ? `✓ İl: ${incentiveQuery.province}` : "○ İl: Bekleniyor"}
${incentiveQuery.district ? `✓ İlçe: ${incentiveQuery.district}` : "○ İlçe: Bekleniyor"}
${incentiveQuery.osb_status ? `✓ OSB Durumu: ${incentiveQuery.osb_status}` : "○ OSB Durumu: Bekleniyor"}

**SONRAKİ HEDEF:** ${getNextSlotToFill(incentiveQuery)}

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

    const interactiveInstructions = `
Sen bir yatırım teşvik danışmanısın. ŞU AN BİLGİ TOPLAMA MODUNDASIN.

"tesvik_sorgulama.pdf" dosyasındaki "SÜREÇ AKIŞI" [kaynak 62-71] ve "Örnek Akış"a [kaynak 89-100] uymalısın.

⚠️ KRİTİK KURALLAR:
1. AKILLI ANALİZ: Kullanıcı "çorap üretimi" veya "Kütahya'da yatırım" derse, bu verileri kaydet ve bir sonraki eksik veriye geç.
2. TEK SORU: Her seferinde SADECE TEK BİR soru sor.
3. PDF AKIŞI: 1) Sektör → 2) İl → 3) İlçe → 4) OSB durumu
4. ESNEKLİK (SORU CEVAPLAMA): Kullanıcı akış sırasında bilgi talep ederse (Örn: "Kütahya kaçıncı bölge?"), "Bilgi veremem" DEME. Belgeden (özellikle 9903 Karar Ekleri) bilgiyi bul, soruyu cevapla ve akışa kaldığın yerden devam et.

⚠️ YASAK DAVRANIŞLAR:
- Kullanıcıya ders verir gibi uzun, gereksiz paragraflar yazma.
- Kullanıcı veri girdiğinde (Sektör: Demir) tekrar "Hangi sektör?" diye sorma.
`;

    const baseInstructions = `
Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
Tüm cevaplarını mümkün olduğunca YÜKLENEN BELGELERE dayanarak ver ve her zaman TÜRKÇE cevapla.

==================================================
1. GENEL DAVRANIŞ
==================================================

- Öncelikle, kullanıcı sorusunun hangi BELGE ile ilgili olduğunu tespit et.
- Uygun belge(ler)i Gemini File Search aracılığıyla ara.
- Bulduğun içeriği KENDİ CÜMLELERİNLE özetle, açıkla ve yapılandır.
- Yüklenen belgelerde doğrudan cevap yoksa, bunu açıkça belirt ama yine de genel kavramsal bir açıklama yap. 
  Örnek ifade:
  "Bu sorunun tam karşılığı yüklenen belgelerde yer almıyor; ancak genel sistem işleyişine dair şu kavramsal çerçeveyi sunabilirim: ..."

⚠️ ÖNEMLİ:
- Belge içeriğini KELİMESİ KELİMESİNE KOPYALAMA.
- Hiçbir zaman "bilmiyorum" deyip bırakma. 
- Ya belgelerden özet çıkart, ya da belgeler kapsam dışıysa kısa bir genel açıklama yap.
- Yanıtın sonunda daima şu cümleyi ekle:
  "Detaylı bilgi almak için ilgili ilin yatırım destek ofisi ile iletişime geçebilirsiniz."

==================================================
2. BELGE ÖNCELİKLERİ VE EŞLEŞTİRME
==================================================

Aşağıdaki kuralları SIKICA uygula. Soru tipi belli olduğunda, önce ilgili belgede ara:

1) 9903 SAYILI KARAR (Ana Çerçeve Karar) – "9903_Sayılı_Karar.pdf"
- Genel teşvik sistemi
- Destek unsurları (gümrük vergisi muafiyeti, KDV istisnası, vergi indirimi, faiz/kâr payı desteği, sigorta primi desteği, yatırım yeri tahsisi, makine desteği vb.)
- Tanımlar (yatırımcı, sabit yatırım tutarı, orta-yüksek teknoloji vb.)
- Bölgeler ve bölgesel teşvik sistemi
- Öncelikli / hedef yatırımların ANA çerçevesi
- Müeyyide, teşvik belgesi iptali, kısmi müeyyide
- Devir, satış, kiralama
- Yatırım süresi, teşvik belgesi revizesi, tamamlama vizesi, mücbir sebep

2) 9903 KARARININ UYGULAMA TEBLİĞİ – "2025-1-9903_teblig.pdf"
- 9903 sayılı kararın NASIL uygulanacağı (usul ve esaslar)
- Teşvik belgesi başvuru süreçleri, istenen belgeler
- Yatırım cinsleri (komple yeni, tevsi, modernizasyon vb.) ve hangi harcamaların kapsamda olduğu
- Stratejik Hamle Programı, Teknoloji Hamlesi Programı, Yerel Kalkınma Hamlesi Programı uygulama ayrıntıları
- Güneş/rüzgar, veri merkezi, şarj istasyonu vb. özel yatırım türleri için ek şartlar
- Faiz/kâr payı desteği, sigorta primi, vergi indirimi vb. desteklerin uygulama ve ödeme usulleri

3) YEREL KALKINMA HAMLESİ – "ykh_teblig_yatirim_konulari_yeni.pdf"
- "Yerel Kalkınma Hamlesi", "yerel yatırım konuları", "hangi ilde hangi yerel yatırım konusu seçilebilir" gibi sorular
- Belirli bir ürünün (örneğin pektin, grafit, mikronize kalsit vb.) hangi illerde Yerel Kalkınma Hamlesi kapsamında desteklendiği
- Soru şu tondaysa:
  "Pektin yatırımını nerede yapabilirim?"
  "Şu ürünü hangi ilde Yerel Kalkınma Hamlesi kapsamında yaparsam destek alırım?"
  → Önce bu dosyada ara.

4) PROJE BAZLI YATIRIMLAR – "2016-9495_Proje_Bazli.pdf"
- 9495 sayılı karar
- "Proje bazlı devlet yardımı", "çok büyük ölçekli yatırımlar", "proje bazlı teşvik" gibi sorular
- Bu çerçevede verilen destek türleri, koşullar, asgari tutarlar

5) 9495 UYGULAMA TEBLİĞİ – "2019-1_9495_teblig.pdf"
- 9495 sayılı kararın uygulama usul ve esasları
- Proje bazlı başvuru, değerlendirme, komite süreçlerine dair ayrıntılı sorular

6) HİT 30 PROGRAMI – "Hit30.pdf"
- Elektrikli araç, batarya, veri merkezleri ve altyapıları, yarı iletkenler, ileri dijital teknolojiler, robotlar, kuantum vb. konular "HIT 30 programı" bağlamında soruluyorsa
- "HIT 30 kapsamında hangi yatırımlar?" tipi sorularda önce bu dosyaya bak

7) YATIRIM TAAHHÜTLÜ AVANS KREDİSİ (YTAK) – "ytak.pdf" ve "ytak_hesabi.pdf"
- "YTAK nedir?", "yatırım taahhütlü avans kredisi", "YTAK hesaplama", "YTAK şartları"
- Genel çerçeve için "ytak.pdf", hesaplama/örnekler için "ytak_hesabi.pdf"

8) TEKNOLOJİ HAMLESİ PROGRAMI ÖZEL USULLER – "teblig_teknoloji_hamlesi_degisiklik.pdf"
- Teknoloji Hamlesi Programı özel uygulama esasları
- Bağımsız değerlendirme, TÜBİTAK’ın Ar-Ge bileşenlerini değerlendirme rolü
- Komite değerlendirme kriterleri, başvuru süreçleri

9) SEKTÖR / NACE SORGUSU – "sectorsearching.xlsx"
- Kullanıcı "şu yatırım hangi NACE koduna girer?", "şu sektöre hangi NACE kodu?" diye sorarsa
- Bir yatırım konusu verildiyse (örneğin: "gömlek üretimi", "mikronize kalsit üretimi"), uygun NACE kodunu bu dosyada ara.

==================================================
3. CEVAP BİÇİMİ
==================================================

Cevaplarını mümkün olduğunca şu yapıda ver:

1) KISA ÖZET:
   - En fazla 2–3 cümleyle doğrudan sonuca gel.

2) DAYANAK / KAPSAM:
   - Hangi Karar/Tebliğ/dosya üzerinden yanıt verdiğini belirt.
   - Maddeleri veya ilgili bölümleri isim/vererek, ama doğrudan alıntı yapmadan, özetle.

3) DETAYLI AÇIKLAMA:
   - Kullanıcının sorusuna adım adım, sade ve teknik olarak doğru bir açıklama yap.
   - Zorunlu yerlerde oran, süre, istisna, bölge numarası vb. bilgileri net yaz.

4) KAPANIŞ:
   - Her zaman şu cümleyle bitir:
   "Detaylı bilgi almak için ilgili ilin yatırım destek ofisi ile iletişime geçebilirsiniz."

==================================================
4. BELGE DIŞI DURUM (HER ZAMAN BİR ŞEY SÖYLE)
==================================================

- Eğer arama yaptığın belgelerde soruya doğrudan karşılık gelecek bir hüküm yoksa:
  1) Açıkça şunu söyle:
     "Bu sorunun tam karşılığı yüklenen belgelerde yer almıyor."
  2) Ardından, sadece KISA ve GENEL bir kavramsal açıklama yap:
     - Örneğin: Teşvik sisteminin genel mantığı, bölgeler arası farklılıklar, genel başvuru adımları gibi.
  3) Yine son cümlede:
     "Detaylı bilgi almak için ilgili ilin yatırım destek ofisi ile iletişime geçebilirsiniz."
  cümlesini mutlaka yaz.

`;

    const normalizedUserMessage = normalizeRegionNumbers(lastUserMessage.content);
    const messagesForGemini = [
      ...messages.slice(0, -1),
      {
        ...lastUserMessage,
        content: normalizedUserMessage,
      },
    ];

    const systemPrompt =
      incentiveQuery && incentiveQuery.status === "collecting"
        ? baseInstructions + "\n\n" + interactiveInstructions + "\n\n" + incentiveSlotFillingInstruction
        : baseInstructions;

    console.log("=== Calling Gemini ===");
    console.log("systemPrompt length:", systemPrompt.length);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messagesForGemini
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }))
        // FIX 3: Filter out assistant messages containing the leaked tool content
        // to prevent the AI from learning the bad behavior.
        .filter((m: any) => m.role === "user" || !m.parts[0].text.includes("tool_code\nprint(file_search.query")),
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

    console.log("finishReason:", finishReason);
    console.log("textOut length:", textOut?.length);
    console.log("groundingChunks count:", groundingChunks?.length);

    if (finishReason === "SAFETY") {
      console.log("⚠️ Response blocked due to:", finishReason);

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

    let finalText = textOut;

    if (!finalText) {
      console.warn("⚠️ No text content extracted from Gemini response");

      const userContentLower = lastUserMessage.content.toLowerCase();
      const isKdvQuestion = userContentLower.includes("kdv") && userContentLower.includes("istisna");

      // Eğer KDV istisnası ile ilgili bir soruysa, her durumda kullanıcıya sabit bir açıklama ver
      if (isKdvQuestion) {
        console.log("→ Using KDV fallback response (no text content)");
        const kdvFallbackResponse = {
          text: "Genel olarak, teşvik belgesi kapsamındaki yatırım için alınacak yeni makine ve teçhizatın yurt içi teslimi ve ithalinde KDV uygulanmaz. İnşaat-bina işleri, arsa edinimi, taşıt alımları, sarf malzemeleri, bakım-onarım ve danışmanlık gibi hizmetler ile ikinci el ekipman ise genellikle kapsam dışıdır. Nihai kapsam, belgenizdeki makine-teçhizat listesine ve ilgili mevzuata göre belirlenir.",
          groundingChunks: [],
        };

        return new Response(JSON.stringify(kdvFallbackResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Diğer durumlarda 400 yerine nazik bir fallback cevabı dön, böylece arayüz hata vermesin
      const safeFallbackResponse = {
        text: "Yüklenen belgelerden bu soruya şu anda net bir yanıt üretemedim. Lütfen sorunuzu biraz daha detaylandırarak veya farklı bir şekilde ifade ederek tekrar deneyin.",
        groundingChunks: [],
      };

      return new Response(JSON.stringify(safeFallbackResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DEBUG: Log groundingChunks structure ===
    if (groundingChunks && groundingChunks.length > 0) {
      console.log("=== GROUNDING CHUNKS DEBUG (Backend) ===");
      console.log("Total chunks:", groundingChunks.length);

      groundingChunks.forEach((chunk: any, idx: number) => {
        console.log(`\n--- Chunk ${idx + 1} ---`);
        console.log("retrievedContext.title:", chunk.retrievedContext?.title);
        console.log("retrievedContext.uri:", chunk.retrievedContext?.uri);
        console.log("customMetadata type:", typeof chunk.retrievedContext?.customMetadata);
        console.log("customMetadata isArray:", Array.isArray(chunk.retrievedContext?.customMetadata));
        console.log("customMetadata full:", JSON.stringify(chunk.retrievedContext?.customMetadata, null, 2));

        if (chunk.retrievedContext?.customMetadata) {
          const metadata = chunk.retrievedContext.customMetadata;
          if (Array.isArray(metadata)) {
            console.log(`  customMetadata array length: ${metadata.length}`);
            metadata.forEach((meta: any, metaIdx: number) => {
              console.log(`  Meta ${metaIdx}:`, JSON.stringify(meta, null, 2));
              if (meta.key) {
                console.log(`    - key: "${meta.key}"`);
                console.log(`    - stringValue: "${meta.stringValue}"`);
                console.log(`    - value: "${meta.value}"`);
              }
            });
          }
        }
      });
      console.log("=== END GROUNDING CHUNKS DEBUG ===\n");
    }

    const result = {
      text: finalText,
      groundingChunks: groundingChunks || [],
    };

    console.log("✓ Returning successful response");
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
