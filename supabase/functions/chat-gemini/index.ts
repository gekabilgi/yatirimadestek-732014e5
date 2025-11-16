import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAiClient(): GoogleGenAI {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

// Helper function to create Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

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

    // Load incentive query state if session provided
    let incentiveQuery = null;
    if (sessionId) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data } = await supabaseAdmin
          .from('incentive_queries')
          .select('*')
          .eq('session_id', sessionId)
          .eq('status', 'collecting')
          .single();
        incentiveQuery = data;
        console.log("Loaded incentive query state:", incentiveQuery);
      } catch (error) {
        console.log("No active incentive query for session:", sessionId);
        
        // Auto-start incentive mode if user message contains relevant keywords
        const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
        const incentiveKeywords = ['teşvik', 'hesapla', 'yatırım', 'destek', 'sektör'];
        const shouldStartIncentiveMode = incentiveKeywords.some(keyword => 
          lastUserMessage.includes(keyword)
        );
        
        if (shouldStartIncentiveMode) {
          try {
            const supabaseAdmin = getSupabaseAdmin();
            const { data: newQuery, error: insertError } = await supabaseAdmin
              .from('incentive_queries')
              .insert({
                session_id: sessionId,
                status: 'collecting',
              })
              .select()
              .single();
            
            if (!insertError && newQuery) {
              incentiveQuery = newQuery;
              console.log("Started new incentive query:", incentiveQuery);
            }
          } catch (insertErr) {
            console.error("Error starting incentive query:", insertErr);
          }
        }
      }
    }

    const ai = getAiClient();

    // Helper functions for slot-filling
    const getSlotFillingStatus = (query: any): string => {
      const slots = ['sector', 'province', 'district', 'osb_status'];
      const filled = slots.filter(slot => query[slot]).length;
      return `${filled}/4 bilgi toplandı`;
    };

    const getNextSlotToFill = (query: any): string => {
      if (!query.sector) return "Sektör bilgisi sor";
      if (!query.province) return "İl bilgisi sor";
      if (!query.district) return "İlçe bilgisi sor";
      if (!query.osb_status) return "OSB durumu sor";
      return "Tüm bilgiler toplandı - Hesaplama yap";
    };

    const incentiveSlotFillingInstruction = incentiveQuery ? `

## ⚠️ SERT KURALLAR - UZUN AÇIKLAMA YAPMA - YASAK! ⚠️

**CEVAP FORMATI (ZORUNLU):**
- Maksimum 2 cümle kullan
- İlk cümle: Kısa onay/geçiş (1 cümle)
- İkinci cümle: Tek bir soru (1 cümle)
- Genel bilgi VERME, sadece eksik bilgiyi SOR

**Mevcut Durum:** ${getSlotFillingStatus(incentiveQuery)}
**Toplanan Bilgiler:**
${incentiveQuery.sector ? `✓ Sektör: ${incentiveQuery.sector}` : '○ Sektör: Bekleniyor'}
${incentiveQuery.province ? `✓ İl: ${incentiveQuery.province}` : '○ İl: Bekleniyor'}
${incentiveQuery.district ? `✓ İlçe: ${incentiveQuery.district}` : '○ İlçe: Bekleniyor'}
${incentiveQuery.osb_status ? `✓ OSB Durumu: ${incentiveQuery.osb_status}` : '○ OSB Durumu: Bekleniyor'}

**SONRAKİ ADIM:** ${getNextSlotToFill(incentiveQuery)}

### SORU ÖRNEKLERİ (TAM OLARAK BU ŞEKİLDE):

${!incentiveQuery.sector ? `
**SEKTÖR SORGUSU:**
✅ DOĞRU: "Anladım. Hangi sektörde yatırım yapacaksınız?"
❌ YANLIŞ: "Türkiye'deki yatırım teşvik sisteminde... [uzun açıklama]... hangi sektörde yatırım yapmayı düşünüyorsunuz?"
` : ''}

${incentiveQuery.sector && !incentiveQuery.province ? `
**İL SORGUSU:**
✅ DOĞRU: "Teşekkürler. Hangi ilde yatırım yapacaksınız?"
❌ YANLIŞ: "Gömlek üretimi için Türkiye'de birçok teşvik var... [uzun açıklama]... hangi ilde?"
` : ''}

${incentiveQuery.province && !incentiveQuery.district ? `
**İLÇE SORGUSU:**
✅ DOĞRU: "Tamam. Hangi ilçede? (Merkez için 'Merkez' yazabilirsiniz)"
❌ YANLIŞ: "İl bilgisini aldım. Türkiye'de ilçelere göre farklı... [uzun açıklama]... hangi ilçe?"
` : ''}

${incentiveQuery.district && !incentiveQuery.osb_status ? `
**OSB SORGUSU:**
✅ DOĞRU: "Anladım. OSB içinde mi dışında mı olacak?"
❌ YANLIŞ: "OSB'ler organize sanayi bölgeleridir ve... [uzun açıklama]... OSB içi mi dışı mı?"
` : ''}

${incentiveQuery.sector && incentiveQuery.province && incentiveQuery.district && incentiveQuery.osb_status ? `
**HESAPLAMA ZAMANI:**
Tüm bilgiler toplandı. Şimdi "tesvik_sorgusu.pdf" dosyasındaki SÜREÇ AKIŞI'na göre:

**Hesaplama Sorgusu:**
"Kullanıcının yatırım bilgileri:
- Sektör: ${incentiveQuery.sector}
- İl: ${incentiveQuery.province} 
- İlçe: ${incentiveQuery.district}
- OSB Durumu: ${incentiveQuery.osb_status}

GÖREV:
1. 6. Bölge kuralını kontrol et
2. İstanbul ve GES/RES istisnalarını kontrol et
3. Öncelikli/Hedef yatırım kategorisini belirle
4. Alacağı destekleri hesapla:
   - Faiz/Kar Payı Desteği (oran ve üst limit)
   - Vergi İndirimi (yatırıma katkı oranı)
   - SGK İşveren Primi Desteği (süre ve alt bölge)
   - KDV İstisnası (var/yok)
   - Gümrük Vergisi Muafiyeti (var/yok)
5. Detaylı rapor sun"
` : ''}
` : '';

    const systemInstruction = incentiveQuery 
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
9903 sayılı karar, yatırım teşvikleri hakkında genel bilgiler, destek unsurları soruları, tanımlar, müeyyide, devir, teşvik belgesi revize, tamamlama vizesi ve mücbir sebep gibi idari süreçler vb. kurallar ve şartlarla ilgili soru sorulduğunda sorunun cevaplarını mümkün mertebe "9903_Sayılı_Karar.pdf" dosyasında ara
9903 sayılı kararın uygulama usul ve esasları niteliğinde tebliğ, Teşvik belgesi başvuru şartları, yöntemi ve gerekli belgeler, Hangi yatırım türlerinin (komple yeni, tevsi, modernizasyon vb.) ve harcamaların destek kapsamına alınacağı, Özel sektör projeleri için stratejik hamle programı değerlendirme kriterleri ve süreci, Güneş, rüzgar enerjisi, veri merkezi, şarj istasyonu gibi belirli yatırımlar için ek şartlar, Faiz/kâr payı, sigorta primi, vergi indirimi gibi desteklerin ödeme ve uygulama esasları sorulduğunda sorunun cevaplarını mümkün mertebe "2025-1-9903_teblig.pdf" dosyasında ara
9495 sayılı karar kapsamında proje bazlı yatırımlar, çok büyük ölçekli yatırımlar hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2016-9495_Proje_Bazli.pdf" dosyasında ara
9495 sayılı kararın uygulanmasına yönelik usul ve esaslarla ilgili tebliğ için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2019-1_9495_teblig.pdf" dosyasında ara
HIT 30 programı kapsamında elektrikli araç, batarya, veri merkezleri ve alt yapıları, yarı iletkenlerin üretimi, Ar-Ge, kuantum, robotlar vb. yatırımları için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "Hit30.pdf" dosyasında ara
yatırım taahhütlü avans kredisi, ytak hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "ytak.pdf" ve "ytak_hesabi.pdf" dosyalarında ara
9903 saylı karar ve karara ilişkin tebliğde belirlenmemiş "teknoloji hamlesi programı" hakkında programın uygulama esaslarını, bağımsız değerlendirme süreçleri netleştirilmiş ve TÜBİTAK'ın Ar-Ge bileşenlerini değerlendirme rolü, Komite değerlendirme kriterleri, başvuruları hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "teblig_teknoloji_hamlesi_degisiklik.pdf" dosyasında ara
yerel kalkınma hamlesi, yerel yatırım konuları gibi ifadelerle soru sorulduğunda, yada Pektin yatırımını nerde yapabilirim gibi sorular geldiğinde sorunun cevaplarını mümkün mertebe "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında ara

Teşvik Sorgulama Görevi:
Yüklediğim "tesvik_sorgusu.pdf" dosyasında yer alan "TEMEL KURALLAR", "VERİ KAYNAKLARI" ve "SÜREÇ AKIŞI" başlıkları altında verilen bilgilere dayanarak:
1. Adım adım mantık yürüterek bu yatırımın hangi destek kategorisine girdiğini bul (Önce 6. Bölge Kuralını kontrol et).
2. İstanbul ve GES/RES istisnalarını kontrol et.
3. Alacağı destekleri (Faiz, Vergi İndirimi, SGK Süresi, Alt Bölge, KDV, Gümrük) hesapla.
4. Sonucu bana detaylı bir rapor olarak sun.

${incentiveSlotFillingInstruction}

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

    // Update incentive query state if session provided
    if (sessionId && incentiveQuery) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        
        // Enhanced pattern matching to extract slot values from user's last message
        const updates: any = {};
        const normalizedMessage = lastUserMessage.trim();
        const lowerMsg = normalizedMessage.toLowerCase();
        
        // If no sector yet, assume this message contains the sector
        if (!incentiveQuery.sector && normalizedMessage) {
          updates.sector = normalizedMessage;
        }
        // If sector exists but no province, assume this is the province
        else if (incentiveQuery.sector && !incentiveQuery.province && normalizedMessage) {
          // Clean up common suffixes like "'da", "'de", "ili" etc.
          const cleanedProvince = normalizedMessage
            .replace(/'da$/i, '')
            .replace(/'de$/i, '')
            .replace(/\sili$/i, '')
            .trim();
          updates.province = cleanedProvince;
        }
        // If province exists but no district, assume this is the district
        else if (incentiveQuery.province && !incentiveQuery.district && normalizedMessage) {
          updates.district = normalizedMessage;
        }
        // If district exists but no OSB status, check for İÇİ/DIŞI keywords with more patterns
        else if (incentiveQuery.district && !incentiveQuery.osb_status && normalizedMessage) {
          if (lowerMsg.includes('içi') || lowerMsg.includes('içinde') || lowerMsg.includes('osb içi') || 
              lowerMsg.includes('organize sanayi') || lowerMsg === 'içi' || lowerMsg === 'ici') {
            updates.osb_status = 'İÇİ';
          } else if (lowerMsg.includes('dışı') || lowerMsg.includes('dışında') || lowerMsg.includes('osb dışı') || 
                     lowerMsg === 'dışı' || lowerMsg === 'disi' || lowerMsg.includes('hayır') || lowerMsg.includes('değil')) {
            updates.osb_status = 'DIŞI';
          }
        }
        
        // Update if we extracted any new information
        if (Object.keys(updates).length > 0) {
          const allSlotsFilled = 
            (updates.sector || incentiveQuery.sector) &&
            (updates.province || incentiveQuery.province) &&
            (updates.district || incentiveQuery.district) &&
            (updates.osb_status || incentiveQuery.osb_status);
          
          if (allSlotsFilled) {
            updates.status = 'completed';
          }
          
          await supabaseAdmin
            .from('incentive_queries')
            .update(updates)
            .eq('session_id', sessionId);
          
          console.log("Updated incentive query with:", updates);
        }
      } catch (error) {
        console.error("Error updating incentive query:", error);
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
  } catch (error) {
    console.error("Error in chat-gemini:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
