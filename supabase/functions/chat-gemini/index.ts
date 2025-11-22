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
      temperature: 0.5,
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
**Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
**Kullanıcı tarafından sorulan bir soruyu öncelikle tüm dökümanlarda ara, eğer sorunun cevabı özel kurallara uygunsa hangi kural en uygun ise ona göre cevabı oluştur, eğer interaktif bir sohbet olarak algılarsan "interactiveInstructions" buna göre hareket et.
**Tüm cevaplarını mümkün olduğunca YÜKLEDİĞİN BELGELERE dayanarak ver.
**Soruları **Türkçe** cevapla.
**Belge içeriğiyle çelişen veya desteklenmeyen genellemeler yapma.

⚠️ ÖNEMLİ: Belge içeriklerini AYNEN KOPYALAMA. Bilgileri kendi cümlelerinle yeniden ifade et, özetle ve açıkla. Hiçbir zaman doğrudan alıntı yapma.

Özel Kurallar:
- 9903 sayılı karar, yatırım teşvikleri hakkında genel bilgiler, destek unsurları soruları, tanımlar, müeyyide, devir, teşvik belgesi revize, tamamlama vizesi ve mücbir sebep gibi idari süreçler vb. kurallar ve şartlarla ilgili soru sorulduğunda sorunun cevaplarını mümkün mertebe "9903_Sayılı_Karar.pdf" dosyasında ara.
- İllerin Bölge Sınıflandırması sorulduğunda (Örn: Kütahya kaçıncı bölge?), cevabı 9903 sayılı kararın eklerinde veya ilgili tebliğ dosyalarında (EK-1 İllerin Bölgesel Sınıflandırması) ara.
- 9903 sayılı kararın uygulanmasına ilişkin usul ve esaslar, yatırım teşvik belgesi başvuru şartları (yöntem, gerekli belgeler), hangi yatırım cinslerinin (komple yeni, tevsi, modernizasyon vb.) ve harcamaların destek kapsamına alınacağı, özel sektör projeleri için Stratejik Hamle Programı değerlendirme kriterleri ve süreci, güneş/rüzgar enerjisi, veri merkezi, şarj istasyonu gibi belirli yatırımlar için aranan ek şartlar ile faiz/kâr payı, sigorta primi, vergi indirimi gibi desteklerin ödeme ve uygulama usullerine ilişkin bir soru geldiğinde, cevabı öncelikle ve ağırlıklı olarak "2025-1-9903_teblig.pdf" dosyası içinde ara ve yanıtını mümkün olduğunca bu dosyadaki hükümlere dayandır.
- yerel kalkınma hamlesi, yerel yatırım konuları gibi ifadelerle soru sorulduğunda, yada Pektin yatırımını nerde yapabilirim gibi sorular geldiğinde sorunun cevaplarını mümkün mertebe "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında ara
- 9495 sayılı karar kapsamında proje bazlı yatırımlar, çok büyük ölçekli yatırımlar hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2016-9495_Proje_Bazli.pdf" dosyasında ara
- 9495 sayılı kararın uygulanmasına yönelik usul ve esaslarla ilgili tebliğ için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2019-1_9495_teblig.pdf" dosyasında ara
- HIT 30 programı kapsamında elektrikli araç, batarya, veri merkezleri ve alt yapıları, yarı iletkenlerin üretimi, Ar-Ge, kuantum, robotlar vb. yatırımları için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "Hit30.pdf" dosyasında ara
- Yatırım taahhütlü avans kredisi, ytak hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "ytak.pdf" ve "ytak_hesabi.pdf" dosyalarında ara
- 9903 saylı karar ve karara ilişkin tebliğde belirlenmemiş "teknoloji hamlesi programı" hakkında programın uygulama esaslarını, bağımsız değerlendirme süreçleri netleştirilmiş ve TÜBİTAK'ın Ar-Ge bileşenlerini değerlendirme rolü, Komite değerlendirme kriterleri, başvuruları hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "teblig_teknoloji_hamlesi_degisiklik.pdf" dosyasında ara 
- Bir yatırım konusu sorulursa veya bir yatırım konusu hakkında veya nace kodu sorulursa "sectorsearching.xlsx" dosyasında ara.
- Etuys için "Sistemsel Sorunlar (Açılmama, İmza Hatası vs.)", "Belge Başvurusuna İlişkin sorular", "Devir İşlemleri", "Revize Başvuruları", "Yerli ve İthal Gerçekleştirmeler-Fatura ve Gümrük İşlemleri", "Vergi İstisna Yazısı Alma İşlemleri", "Tamamlama Vizesi İşlemleri", ve "hata mesajları" ile ilgili sistemsel sorunlarda çözüm arayanlar için "etuys_systemsel_sorunlar.txt" dosyasında ara.
- Bilgileri verirken mutlaka kendi cümlelerinle açıkla, özetle ve yeniden ifade et. Belge içeriğini kelimesi kelimesine kopyalama.
- Eğer yüklenen belgeler soruyu kapsamıyorsa "Bu soru yüklenen belgelerin kapsamı dışında, sadece genel kavramsal açıklama yapabilirim." diye belirt ve genel kavramı çok kısa özetle.
- En son satıra detaylı bilgi almak için ilgili ilin yatırım destek ofisi ile iletişime geçebilirsiniz.
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

    // === Real-time Document Metadata Enrichment ===
    // Extract document IDs (prioritize documentName, fallback to title)
    const docIds = groundingChunks
      .map((c: any) => {
        const rc = c.retrievedContext ?? {};
        // Öncelik: documentName (tam resource adı) → title (ID only)
        if (rc.documentName) return rc.documentName;
        if (rc.title) {
          // title sadece ID ise, store ile birleştir
          return rc.title.startsWith('fileSearchStores/') 
            ? rc.title 
            : `${storeName}/documents/${rc.title}`;
        }
        return null;
      })
      .filter((id: string | null): id is string => !!id);

    const uniqueDocIds = [...new Set(docIds)];
    
    console.log("=== Fetching Document Metadata ===");
    console.log("Unique document IDs:", uniqueDocIds);
    
    const documentMetadataMap: Record<string, string> = {};
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    const normalizeDocumentName = (rawId: string): string => {
      if (rawId.startsWith('fileSearchStores/')) {
        return rawId;
      }
      // rawId sadece belge ID'si ise
      return `${storeName}/documents/${rawId}`;
    };
    
    for (const rawId of uniqueDocIds) {
      try {
        const documentName = normalizeDocumentName(rawId);
        const url = `https://generativelanguage.googleapis.com/v1beta/${documentName}?key=${GEMINI_API_KEY}`;
        console.log(`Fetching metadata for: ${documentName}`);
        
        const docResp = await fetch(url);
        if (docResp.ok) {
          const docData = await docResp.json();
          const customMeta = docData.customMetadata || [];
          
          console.log(`Document ${rawId} customMetadata:`, customMeta);
          
          // Find "Dosya" or "fileName" key
          const filenameMeta = customMeta.find((m: any) => 
            m.key === "Dosya" || m.key === "fileName"
          );
          
          if (filenameMeta) {
            const enrichedName = filenameMeta.stringValue || filenameMeta.value || rawId;
            documentMetadataMap[rawId] = enrichedName;
            console.log(`✓ Enriched ${rawId} -> ${enrichedName}`);
          } else {
            console.log(`⚠ No filename metadata found for ${rawId}`);
          }
        } else {
          console.error(`Failed to fetch ${documentName}: ${docResp.status} - ${await docResp.text()}`);
        }
      } catch (e) {
        console.error(`Error fetching metadata for ${rawId}:`, e);
      }
    }
    
    // Enrich groundingChunks with filenames
    const enrichedChunks = groundingChunks.map((chunk: any) => {
      const rc = chunk.retrievedContext ?? {};
      const rawId = rc.documentName || rc.title || null;
      
      return {
        ...chunk,
        enrichedFileName: rawId ? (documentMetadataMap[rawId] ?? null) : null
      };
    });
    
    console.log("=== Enrichment Complete ===");
    console.log("Metadata map:", documentMetadataMap);

    const result = {
      text: finalText,
      groundingChunks: enrichedChunks || [],
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
