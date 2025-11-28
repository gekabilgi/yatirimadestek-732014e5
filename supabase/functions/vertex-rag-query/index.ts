import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to get OAuth2 token
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  // Create JWT
  const base64Header = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${base64Header}.${base64Payload}`;

  // Import private key
  const rawPrivateKey = serviceAccount.private_key as string;
  const normalizedPrivateKey = rawPrivateKey.includes("\\n")
    ? rawPrivateKey.replace(/\\n/g, "\n")
    : rawPrivateKey;

  const pemLines = normalizedPrivateKey
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l && !l.includes("BEGIN PRIVATE KEY") && !l.includes("END PRIVATE KEY"));
  const pemBody = pemLines.join("");

  let binaryDer: Uint8Array;
  try {
    binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  } catch (e) {
    console.error("Failed to base64-decode private key body. Length:", pemBody.length);
    throw e;
  }

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  // Sign JWT
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signatureInput));

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${base64Signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { corpusName, messages, topK = 20, vectorDistanceThreshold = 0.3 } = await req.json();

    console.log("=== vertex-rag-query request ===");
    console.log("corpusName:", corpusName);
    console.log("messages count:", messages?.length);
    console.log("topK:", topK);
    console.log("vectorDistanceThreshold:", vectorDistanceThreshold);

    if (!corpusName) {
      throw new Error("corpusName is required");
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages must be a non-empty array");
    }

    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== "user") {
      throw new Error("Last message must be from user");
    }

    // Get GCP Service Account credentials
    const GCP_SERVICE_ACCOUNT_JSON = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
    if (!GCP_SERVICE_ACCOUNT_JSON) {
      throw new Error("GCP_SERVICE_ACCOUNT_JSON not configured");
    }

    // Get OAuth2 access token
    const accessToken = await getAccessToken(GCP_SERVICE_ACCOUNT_JSON);

    // Use a Vertex AI Gemini model that is available in europe-west1
    const model = "gemini-1.5-pro-001";
    const endpoint = `https://europe-west1-aiplatform.googleapis.com/v1/projects/394408754498/locations/europe-west1/publishers/google/models/${model}:generateContent`;

    // Detailed Turkish system prompt with file-based routing and comprehensive rules
    const detailedSystemPrompt = `**Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın.
**Kullanıcı tarafından sorulan bir soruyu öncelikle tüm dökümanlarda ara, eğer sorunun cevabı özel kurallara uygunsa hangi kural en uygun ise ona göre cevabı oluştur, eğer interaktif bir sohbet olarak algılarsan "interactiveInstructions" buna göre hareket et.
**Tüm cevaplarını mümkün olduğunca YÜKLEDİĞİN BELGELERE dayanarak ver.
**Soruları **Türkçe** cevapla.
**Belge içeriğiyle çelişen veya desteklenmeyen genellemeler yapma.

⚠️ ÖNEMLİ: Belge içeriklerini AYNEN KOPYALAMA. Bilgileri kendi cümlelerinle yeniden ifade et, özetle ve açıkla. Hiçbir zaman doğrudan alıntı yapma.

## İL LİSTELEME KURALLARI (ÇOK ÖNEMLİ):
Bir ürün/sektör hakkında "hangi illerde" sorulduğunda:
1. Belgede geçen **TÜM illeri madde madde listele** - eksik bırakma!
2. "Mersin ve Giresun illerinde..." gibi özet YAPMA!
3. Her ili **ayrı satırda, numaralandırarak** yaz:
   1. Mersin - [yatırım konusu açıklaması]
   2. Tokat - [yatırım konusu açıklaması]
   3. Isparta - [yatırım konusu açıklaması]
   ...
4. **"ve diğerleri", "gibi" deme** - hepsini yaz
5. Eğer belgede 8 il varsa, 8'ini de listele
6. İl sayısını **yanıltıcı şekilde azaltma**

Özel Kurallar:
- 9903 sayılı karar, yatırım teşvikleri hakkında genel bilgiler, destek unsurları soruları, tanımlar, müeyyide, devir, teşvik belgesi revize, tamamlama vizesi ve mücbir sebep gibi idari süreçler vb. kurallar ve şartlarla ilgili soru sorulduğunda sorunun cevaplarını mümkün mertebe "9903_karar.pdf" dosyasında ara.
- İllerin Bölge Sınıflandırması sorulduğunda (Örn: Kütahya kaçıncı bölge?), cevabı 9903 sayılı kararın eklerinde veya ilgili tebliğ dosyalarında (EK-1 İllerin Bölgesel Sınıflandırması) ara.
- 9903 sayılı kararın uygulanmasına ilişkin usul ve esaslar, yatırım teşvik belgesi başvuru şartları (yöntem, gerekli belgeler), hangi yatırım cinslerinin (komple yeni, tevsi, modernizasyon vb.) ve harcamaların destek kapsamına alınacağı, özel sektör projeleri için Stratejik Hamle Programı değerlendirme kriterleri ve süreci, güneş/rüzgar enerjisi, veri merkezi, şarj istasyonu gibi belirli yatırımlar için aranan ek şartlar ile faiz/kâr payı, sigorta primi, vergi indirimi gibi desteklerin ödeme ve uygulama usullerine ilişkin bir soru geldiğinde, cevabı öncelikle ve ağırlıklı olarak "2025-1-9903_teblig.pdf" dosyası içinde ara ve yanıtını mümkün olduğunca bu dosyadaki hükümlere dayandır.
- Yerel kalkınma hamlesi, yerel yatırım konuları gibi ifadelerle soru sorulduğunda, yada örneğin; pektin yatırımını nerde yapabilirim gibi sorular geldiğinde "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" dosyasında yatırım konusu içerisinde pektin kelimesi geçen yatırım konularına göre sorunun cevaplarını ara. Yatırım konularında parantez içerisinde bile geçse onları da dahil et.
- 9495 sayılı karar kapsamında proje bazlı yatırımlar, çok büyük ölçekli yatırımlar hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2016-9495_Proje_Bazli.pdf" dosyasında ara
- 9495 sayılı kararın uygulanmasına yönelik usul ve esaslarla ilgili tebliğ için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "2019-1_9495_teblig.pdf" dosyasında ara
- HIT 30 programı kapsamında elektrikli araç, batarya, veri merkezleri ve alt yapıları, yarı iletkenlerin üretimi, Ar-Ge, kuantum, robotlar vb. yatırımları için gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "Hit30.pdf" dosyasında ara
- Yatırım taahhütlü avans kredisi, ytak hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "ytak.pdf" ve "ytak_hesabi.pdf" dosyalarında ara
- 9903 saylı karar ve karara ilişkin tebliğde belirlenmemiş "teknoloji hamlesi programı" hakkında programın uygulama esaslarını, bağımsız değerlendirme süreçleri netleştirilmiş ve TÜBİTAK'ın Ar-Ge bileşenlerini değerlendirme rolü, Komite değerlendirme kriterleri, başvuruları hakkında gelebilecek sorular sorulduğunda sorunun cevaplarını mümkün mertebe "teblig_teknoloji_hamlesi_degisiklik.pdf" dosyasında ara 
- Bir yatırım konusu sorulursa veya bir yatırım konusu hakkında veya nace kodu sorulursa "sectorsearching.xlsx" dosyasında ara.
- Etuys için "Sistemsel Sorunlar (Açılmama, İmza Hatası vs.)", "Belge Başvurusuna İlişkin sorular", "Devir İşlemleri", "Revize Başvuruları", "Yerli ve İthal Gerçekleştirmeler-Fatura ve Gümrük İşlemleri", "Vergi İstisna Yazısı Alma İşlemleri", "Tamamlama Vizesi İşlemleri", ve "hata mesajları" ile ilgili sistemsel sorunlarda çözüm arayanlar için "etuys_systemsel_sorunlar.txt" dosyasında ara.
- Bilgileri verirken mutlaka kendi cümlelerinle açıkla, özetle ve yeniden ifade et. Belge içeriğini kelimesi kelimesine kopyalama.
- Eğer yüklenen belgeler soruyu kapsamıyorsa "Bu soru yüklenen belgelerin kapsamı dışında, sadece genel kavramsal açıklama yapabilirim." diye belirt ve genel kavramı çok kısa özetle.
- En son satıra detaylı bilgi almak için ilgili ilin yatırım destek ofisi ile iletişime geçebilirsiniz.`;

    // Build request body for Vertex AI
    const requestBody = {
      contents: messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      generation_config: {
        maxOutputTokens: 65535,
        temperature: 0.1,
        topP: 0.95,
      },
      safety_settings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
      ],
      system_instruction: {
        parts: [{ text: detailedSystemPrompt }],
      },
      tools: [
        {
          retrieval: {
            vertex_rag_store: {
              rag_resources: [
                {
                  rag_corpus: corpusName,
                },
              ],
              similarity_top_k: topK,
              vector_distance_threshold: vectorDistanceThreshold,
            },
          },
        },
      ],
    };

    console.log("Calling Vertex AI endpoint:", endpoint);
    console.log("Using corpus:", corpusName);

    // Call Vertex AI API
    const vertexResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error("Vertex AI error:", errorText);
      throw new Error(`Vertex AI request failed: ${vertexResponse.status} ${errorText}`);
    }

    const vertexData = await vertexResponse.json();
    console.log("Vertex AI response received");

    // Extract text and grounding metadata from response
    const candidate = vertexData.candidates?.[0];
    if (!candidate) {
      throw new Error("No candidate in Vertex AI response");
    }

    const text = candidate.content?.parts?.map((p: any) => p.text).join("") || "";
    const groundingMetadata = candidate.groundingMetadata || {};
    const groundingChunks = groundingMetadata.retrievalQueries || [];

    // Detailed debug logging
    console.log("=== Vertex AI Response Details ===");
    console.log("Text length:", text.length);
    console.log("Grounding chunks count:", groundingChunks.length);
    console.log("First 200 chars:", text.substring(0, 200));
    console.log("Candidate finish reason:", candidate.finishReason);

    // Check for empty or insufficient response
    if (!text || text.trim().length === 0) {
      console.log("WARNING: Empty response from Gemini RAG");
      return new Response(
        JSON.stringify({
          text: "Üzgünüm, sağlanan kaynaklarda bu soruya yanıt verecek bilgi bulunamadı. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin veya daha spesifik detaylar ekleyin.",
          sources: [],
          groundingChunks: [],
          vertexRag: true,
          emptyResponse: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Extract sources from grounding metadata
    const sources =
      groundingMetadata.groundingChunks?.map((chunk: any) => ({
        title: chunk.retrievedContext?.title || "Unknown",
        uri: chunk.retrievedContext?.uri || "",
      })) || [];

    return new Response(
      JSON.stringify({
        text,
        sources,
        groundingChunks,
        vertexRag: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("vertex-rag-query error:", error);
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
