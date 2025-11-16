import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAiClient(): GoogleGenAI {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, messages } = await req.json();

    console.log("chat-gemini: Processing request with storeName:", storeName);

    if (!storeName || !messages || !Array.isArray(messages)) {
      throw new Error("storeName and messages array are required");
    }

    const ai = getAiClient();

    const systemInstruction = `Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
Kullanıcılara yatırım destekleri, teşvik programları ve ilgili konularda yardımcı oluyorsun.
Özel Kurallar:
9903 sayılı karar, yatırım teşvikleri hakkında genel bilgiler, destek unsurları soruları, tanımlar, müeyyide, devir, teşvik belgesi revize, tamamlama vizesi ve mücbir sebep gibi idari süreçler vb. kurallar ve şartlarla ilgili soru sorulduğunda sorunun cevaplarını mümkün mertebe "9903_Sayılı_Karar.pdf" dosyasında ara
9903 sayılı kararın uygulama usul ve esasları niteliğinde tebliğ, Teşvik belgesi başvuru şartları, yöntemi ve gerekli belgeler, Hangi yatırım türlerinin (komple yeni, tevsi, modernizasyon vb.) ve harcamaların destek kapsamına alınacağı, Özel sektör projeleri için stratejik hamle programı değerlendirme kriterleri ve süreci, Güneş, rüzgar enerjisi, veri merkezi, şarj istasyonu gibi belirli yatırımlar için ek şartlar, Faiz/kâr payı, sigorta primi, vergi indirimi gibi desteklerin ödeme ve uygulama esasları sorulduğunda sorunun cevaplarını mümkün mertebe "2025-1-9903_teblig.pdf" dosyasında ara
9495 sayılı karar kapsamında proje bazlı yatırımlar, çok büyük ölçekli yatırımlar hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2016-9495_Proje_Bazli.pdf" dosyasında ara
9495 sayılı kararın uygulanmasına yönelik usul ve esaslarla ilgili tebliğ için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2019-1_9495_teblig.pdf" dosyasında ara
HIT 30 programı kapsamında elektrikli araç, batarya, veri merkezleri ve alt yapıları, yarı iletkenlerin üretimi, Ar-Ge, kuantum, robotlar vb. yatırımları için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "Hit30.pdf" dosyasında ara
yatırım taahhütlü avans kredisi, ytak hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "ytak.pdf" ve "ytak_hesabi.pdf" dosyalarında ara
9903 saylı karar ve karara ilişkin tebliğde belirlenmemiş "teknoloji hamlesi programı" hakkında programın uygulama esaslarını, bağımsız değerlendirme süreçleri netleştirilmiş ve TÜBİTAK'ın Ar-Ge bileşenlerini değerlendirme rolü, Komite değerlendirme kriterleri, başvuruları hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "teblig_teknoloji_hamlesi_degisiklik.pdf" dosyasında ara
yerel kalkınma hamlesi, yerel yatırım konuları gibi ifadelerle soru sorulduğunda, yada Pektin yatırımını nerde yapabilirim gibi sorular geldiğinde sorunun cevaplarını mümkün mertebe "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında ara

Teşvik Sorgulama Görevi:
Yüklediğim "tesvik_sorgusu.pdf" dosyasında yer ala "TEMEL KURALLAR", "VERİ KAYNAKLARI" ve "SÜREÇ AKIŞI" başlıkları altında verilen bilgilere dayanarak:
1. Adım adım mantık yürüterek bu yatırımın hangi destek kategorisine girdiğini bul (Önce 6. Bölge Kuralını kontrol et).
2. İstanbul ve GES/RES istisnalarını kontrol et.
3. Alacağı destekleri (Faiz, Vergi İndirimi, SGK Süresi, Alt Bölge, KDV, Gümrük) hesapla.
4. Sonucu bana detaylı bir rapor olarak sun."

Temel Kurallar:
Türkçe konuş ve profesyonel bir üslup kullan.
Mümkün olduğunca kısa, anlaşılır ve net cevap ver.
ÖNEMLİ: Dokümanlardaki bilgileri kendi cümlelerinle yeniden ifade et. Direkt alıntı yapma, parafraze et.
Sorulan soruda geçen terimleri tüm dokümanın tamamında ara ve bilgileri birleştirerek mantıklı bir açıklama yap.
Cevap sonunda konuyla ilgili daha detaylı sorunuz olursa doğrudan ilgili yatırım destek ofisi uzmanlarına soru sorabilirsiniz.
Son olarak konu dışında küfürlü ve hakaret içeren sorular gelirse karşılık verme sadece görevini söyle.`;

    // Build conversation history with system instruction
    const contents = [
      { role: "user", parts: [{ text: systemInstruction }] },
      { role: "model", parts: [{ text: "Anladım, yatırım teşvikleri konusunda yardımcı olmaya hazırım." }] },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    ];

    // Generate content with file search grounding
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        temperature: 1.2, // Higher temperature to avoid verbatim recitation
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
            },
          },
        ],
      },
    });

    // Check if response was blocked
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

    // Enhanced logging for File Search grounding
    if (groundingChunks.length > 0) {
      console.log("groundingChunks count:", groundingChunks.length);
      console.log("First chunk full structure:", JSON.stringify(groundingChunks[0], null, 2));
      console.log("Has web?:", !!groundingChunks[0].web);
      console.log("Has retrievedContext?:", !!groundingChunks[0].retrievedContext);
      console.log("retrievedContext.uri:", groundingChunks[0].retrievedContext?.uri);
    }

    let textOut = "";
    try {
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
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw e;
    }

    console.log("Final response:", { textLength: textOut.length, groundingChunksCount: groundingChunks.length });

    return new Response(
      JSON.stringify({
        text: textOut,
        groundingChunks,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in chat-gemini:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
