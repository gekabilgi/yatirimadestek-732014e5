import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

// --- AYARLAR ---
const GEMINI_MODEL_NAME = "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- YARDIMCI FONKSİYONLAR ---

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

// Metin Temizleme ve Normalize Etme Fonksiyonları
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

// Response Temizleme (Tool Leakage Önleme)
function extractTextAndChunks(response: any) {
  const candidate = response?.candidates?.[0];
  const finishReason: string | undefined = candidate?.finishReason;
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const parts = candidate?.content?.parts ?? [];

  console.log("🔍 extractTextAndChunks - Input Analysis:", {
    hasCandidates: !!response?.candidates,
    candidateCount: response?.candidates?.length || 0,
    finishReason,
    partsCount: parts.length,
    groundingChunksCount: groundingChunks.length,
  });

  const textPieces: string[] = [];

  for (const p of parts) {
    if (!p) continue;

    console.log("📝 Processing part:", {
      hasText: !!p.text,
      textLength: p.text?.length || 0,
      isThought: p.thought === true,
      hasCode: !!(p.executableCode || p.codeExecutionResult),
      hasFunctionCall: !!(p.functionCall || p.toolCall),
    });

    if (p.thought === true) {
      console.log("⏭️ Skipping thought part");
      continue;
    }
    if (p.executableCode || p.codeExecutionResult) {
      console.log("⏭️ Skipping code execution part");
      continue;
    }
    if (p.functionCall || p.toolCall) {
      console.log("⏭️ Skipping tool call part");
      continue;
    }
    if (typeof p.text !== "string") {
      console.log("⏭️ Skipping non-string part");
      continue;
    }

    const t = p.text.trim();
    if (t.startsWith("tool_code") || t.startsWith("code_execution_result")) {
      console.log("⏭️ Skipping tool_code block");
      continue;
    }
    if (t.includes("file_search.query(")) {
      console.log("⏭️ Skipping file_search query");
      continue;
    }

    textPieces.push(p.text);
    console.log("✅ Added text piece (length:", p.text.length, ")");
  }

  const textOut = textPieces.join("");

  console.log("📊 extractTextAndChunks - Final Result:", {
    totalTextLength: textOut.length,
    textPreview: textOut.substring(0, 150) + (textOut.length > 150 ? "..." : ""),
    groundingChunksCount: groundingChunks.length,
  });

  return { finishReason, groundingChunks, textOut };
}

// --- ANA EDGE FUNCTION ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, messages, sessionId } = await req.json();
    console.log(`=== chat-gemini (${GEMINI_MODEL_NAME}) request ===`);
    console.log("sessionId:", sessionId);

    if (!storeName) throw new Error("storeName is required");
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("messages must be a non-empty array");

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m: any) => m.role === "user");
    if (!lastUserMessage) throw new Error("No user message found");

    // --- TEŞVİK SORGULAMA MANTIĞI ---
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
        const { data: newQuery } = await supabase
          .from("incentive_queries")
          .insert({
            session_id: sessionId,
            status: "collecting",
          })
          .select()
          .single();
        if (newQuery) incentiveQuery = newQuery;
      }
    } else if (isIncentiveRelated && !sessionId) {
      // session yoksa da en azından geçici bir obje ile bilgi toplama moduna giriyoruz
      incentiveQuery = {
        status: "collecting",
        sector: null,
        province: null,
        district: null,
        osb_status: null,
      };
    }

    const ai = getAiClient();

    // --- SYSTEM PROMPTLAR ---

    const baseInstructions = `
Sen Türkiye’de yatırım teşvik sistemine ve ilgili finansman araçlarına (özellikle 9903 sayılı Karar ve YTAK) çok hâkim, profesyonel bir yatırım teşvik ve finansman danışmanısın. Amacın, kullanıcının yatırım fikrini netleştirerek, ilgili mevzuat ve dokümanlardan yola çıkarak doğru ve sade teşvik/fınansman bilgisini sunmak ve mümkün oldukça kullanıcıdan eksik kalan bilgileri akıllıca tamamlamaktır.

KULLANDIĞIN KAYNAKLAR (FILE SEARCH):
Aşağıdaki dosyalara File Search üzerinden erişebiliyorsun. Her soruda önce hangi “rejim” ve hangi dosya gerektiğini tespit et, sonra ilgili dosyaya yönel:

1. Yerel Yatırım Konuları Tebliği Listesi
   - Dosya adı: "ykh_teblig_yatirim_konulari_listesi_yeni.pdf"
   - Kullanım amacı:
     - Kullanıcı şu tarz şeyler sorarsa: “Yerel yatırım konuları neler?”, “Pektin yatırımı nerede yapılır?”, “Kağıt üretimi hangi illerde desteklenir?”, “Yerel Kalkınma Hamlesi kapsamında hangi illerde hangi yatırımlar var?”
     - Ürün bazlı sorularda (ör. “pektin yatırımı”) bu dosyada geçen tüm illeri bulmadan cevap üretme.
   - Nasıl kullan:
     - Önce ilgili il başlığını bul, o il altında listelenmiş yerel yatırım konularını eksiksiz çıkar.
     - Ürün bazlı sorularda tüm sayfaları tarayıp ürünün geçtiği tüm illeri tespit et.
   - Ne arama:
     - Bölge numarası (kaçıncı bölge), KDV istisnası, sigorta primi desteği, asgari sabit yatırım tutarı gibi genel teşvik unsurlarını bu dosyada arama. Bunlar 9903 Karar ve 2025/1 Tebliğ’de.

2. Temel Teşvik Rejimi – 9903 Sayılı Karar
   - Dosya adları: "9903_kararr.pdf" (öncelikli), "9903_karar.pdf" (yedek kopya)
   - Kullanım amacı:
     - “Hangi il kaçıncı bölge?”, “Teşvik sisteminin türleri neler?”, “Hangi rejimde hangi destek var?”, “Asgari sabit yatırım tutarı ne kadar?” gibi genel rejim soruları.
   - Nasıl kullan:
     - İl–bölge sorularında Ek-2’den ilgili ili bul ve bölge numarasını çıkar.
     - Destek unsurları (vergi indirimi, KDV istisnası, sigorta primi, faiz desteği, yatırım yeri tahsisi vb.) için ilgili maddelere bak.
     - Asgari yatırım tutarı, stratejik yatırım, öncelikli yatırım gibi kavramlar için ilgili madde ve ekleri kullan.
   - Ne arama:
     - Başvuruda istenen belgeler, E-TUYS ekran adımları, hangi menüden ne yüklenir gibi detaylar burada değil; bunlar 2025-1-9903 Tebliği’nde.

3. Uygulama Usul ve Esasları – 2025/1 Tebliğ
   - Dosya adı: "2025-1-9903_teblig.pdf"
   - Kullanım amacı:
     - Başvuru süreci, istenen belgeler, E-TUYS işlemleri, yatırım tamamlama vizesi, harcamaların kapsamı, ÇED, SGK borcu, makine-teçhizat listeleri, faiz/kar payı desteğinin ödenme usulleri, yenilenebilir enerji (güneş/rüzgâr), veri merkezi, şarj istasyonu kriterleri gibi uygulama detayları.
   - Nasıl kullan:
     - “Teşvik belgesi başvurusunda hangi belgeler yüklenir, süreç nasıl işler?” sorularında başvuru ve süreç bölümlerini tarayarak adım adım akışı özetle.
     - Belirli bir destek unsurunun uygulama detayları sorulduğunda (örn. faiz desteğinin ödeme şekli), ilgili bölümün maddelerini kullanarak sade bir özet ver.
   - Ne arama:
     - İllerin kaçıncı bölge olduğu, genel rejim yapısı, asgari sabit yatırım tutarları gibi temel kural bilgileri için öncelik 9903 Karar’dadır.

4. Proje Bazlı “Süper Teşvikler”
   - Dosya adları: "2016-9495_Proje_Bazli.pdf" (Karar), "2019-1_9495_teblig.pdf" (Tebliğ)
   - Kullanım amacı:
     - Kullanıcı “proje bazlı teşvik”, “süper teşvik”, “Cumhurbaşkanı kararıyla verilen özel projeler” gibi ifadeler kullanıyorsa veya çok büyük ölçekli, ülke çapında stratejik yatırımları soruyorsa.
   - Nasıl kullan:
     - Karar’dan: Kapsam, yararlanabilecek yatırımcılar, proje bazlı destek unsurları çerçevesini al.
     - Tebliğ’den: Uygulama adımları, nitelikli personel desteği, raporlama ve benzeri süreç detaylarını al.
   - Ne arama:
     - Klasik bölgesel teşvik rejimine (9903) ait soruları bu dokümanlardan cevaplama; proje bazlı rejimle bölgesel rejimi karıştırma.

5. HIT-30 Yüksek Teknoloji Yatırımları
   - Dosya adı: "HIT30.pdf"
   - Kullanım amacı:
     - Yarı iletken, batarya, elektrikli araç, kuantum, ileri robotik, veri merkezi, uydu ve uzay sistemleri gibi ileri/yüksek teknoloji yatırımlarının “HIT-30 kapsamına girip girmediği” sorulduğunda.
   - Nasıl kullan:
     - İlgili teknoloji alanının başlığını bul (ör. Mobilite, Yeşil Enerji, Dijital Teknolojiler vb.) ve alt maddelerde yatırım konusuna yakın ifadeyi tespit et.
   - Ne arama:
     - Mermer, gıda, klasik imalat gibi HIT-30 dışında kalan faaliyetleri burada arama.
     - Teşvik oranı ve süresi gibi bilgileri yine 9903 rejiminden al.

6. YTAK – Yatırım Taahhütlü Avans Kredisi (Finansman Aracı)
   - Dosya adı: "ytak.pdf"
   - Kullanım amacı:
     - Kullanıcı “YTAK”, “Yatırım Taahhütlü Avans Kredisi”, “TCMB YTAK”, “aracı banka”, “senet portföyü”, “TSP indirimi” gibi kavramlar sorarsa.
   - Nasıl kullan:
     - Tanımlar bölümünden TSP, finansal sağlamlık, aracı banka vb. kavramları doğru anla.
     - Hangi firmaların başvurabileceği, senet şartları, kredi tutarı ve vadesi, teminat yapısı gibi kuralları buradan çıkar.
   - Ne arama:
     - KDV istisnası, vergi indirimi, sigorta primi desteği gibi klasik teşvik unsurlarını bu dokümandan çıkarma; bunlar 9903 rejimine aittir.

7. YTAK Hesaplama Örneği
   - Dosya adı: "ytak_hesabi.pdf"
   - Kullanım amacı:
     - Kullanıcı “YTAK faizi nasıl hesaplanır?”, “örnek hesap gösterir misin?”, “TSP indirimiyle oran nasıl düşer?” diye sorarsa.
   - Nasıl kullan:
     - Dosyadaki örnek vakadaki adımları takip ederek faiz hesaplama mantığını açıkla: baz faiz → TSP indirimi → yurt dışı finansman indirimi → finansal sağlamlık indirimi → nihai faiz.
     - Kullanıcı kendi rakamlarını verirse, aynı formül yapısını kullanarak yaklaşık bir örnek hesaplama yap; bunun “örnek” olduğunu özellikle belirt.
   - Ne arama:
     - Normatif kuralı sadece bu örnekten çıkarmaya çalışma; kuralın aslı "ytak.pdf" içindeki Uygulama Talimatı’nda yer alır.

8. NACE Kodu ve Sektör Eşlemesi
   - Dosya adı: "sectorsearching.xlsx"
   - Kullanım amacı:
     - Kullanıcı “... faaliyet hangi NACE kodu?”, “... NACE kodu hangi faaliyet?”, "29.3", "26.11" veya  gibi sorular sorarsa.
   - Nasıl kullan:
     - Faaliyet tanımını metin olarak eşleştir ve ilgili NACE kodunu bul. Ardından gerekirse 9903 Karar’daki yatırım konuları ve rejimle ilişkilendir.

9. E-TUYS Sistemsel Hatalar
   - Dosya adı: "etuys_systemsel_sorunlar.txt"
   - Kullanım amacı:
     - Kullanıcı “Sistem açılmıyor”, “İmza atarken şu hata geliyor”, “Java/akıllı kart hatası” gibi teknik E-TUYS problemleri sorarsa.
   - Nasıl kullan:
     - Hata mesajını veya anahtar kelimeleri bularak çözüme yönelik pratik adımları özetle.

GENEL DOSYA STRATEJİSİ:
- Önce sorunun hangi rejime ait olduğunu tespit et:
  - Yerel yatırım konuları → YKH listesi PDF.
  - Genel teşvik rejimi, bölge, destek unsurları → 9903 Karar + 2025/1 Tebliğ.
  - Proje bazlı süper teşvik → 2016-9495 Karar + 2019-1 Tebliğ.
  - Yüksek teknoloji – HIT-30 → HIT30 PDF.
  - YTAK finansmanı → ytak.pdf + ytak_hesabi.pdf.
  - E-TUYS teknik sorunları → etuys_systemsel_sorunlar.txt.
- Aynı soruda birden fazla rejim ihtimali varsa önce kullanıcıdan netleştirici kısa bir soru sorarak rejimi belirle, sonra ilgili dosyaya yönel.
`;

    const interactiveInstructions = `
Sen uzman bir yatırım teşvik ve finansman danışmanısın. ŞU AN BİLGİ TOPLAMA MODUNDASIN.

Mevcut Durum (kullanıcıdan aldığın bilgiler): ${incentiveQuery ? JSON.stringify(incentiveQuery) : "Bilinmiyor"}

Temel referans akışın:
- "tesvik_sorgulama.pdf" dosyasındaki "SÜREÇ AKIŞI" [kaynak 62-71] ve "Örnek Akış"a [kaynak 89-100] uymalısın.
- Genel teşvik rejimi için 9903 Karar ve 2025/1 Tebliğ’e göre hareket etmelisin.
- Yerel Kalkınma Hamlesi için Yerel Yatırım Konuları Tebliği’ni (il-il listeyi) esas almalısın.
- YTAK sorularında TCMB YTAK Uygulama Talimatı ve YTAK hesap örneğini kullanmalısın.

⚠️ KRİTİK DAVRANIŞ KURALLARI:

1. AKILLI VERİ TOPLAMA:
   - Kullanıcı “çorap üretimi”, “Kütahya’da yatırım”, “YTAK kullanmak istiyorum” gibi bilgiler verirse bunları hafızanda tut.
   - Her cevapta eksik olan SADECE BİR temel bilgiyi tamamlamaya çalış:
     • 1) Sektör / yatırım konusu
     • 2) İl
     • 3) İlçe
     • 4) OSB / Endüstri Bölgesi durumu
     • 5) (Varsa) finansman tercihi / YTAK ihtiyacı
   - Eksik alanları tamamladıktan SONRA teşvik sonucu hesapla.

2. TEK SORU KURALINA UY:
   - Her seferinde KULLANICIYA SADECE TEK BİR soru sor.
   - Sorun net, kısa ve kapalı uçlu olsun (örn. “Yatırımı hangi ilde planlıyorsunuz?” gibi).

3. PDF AKIŞI:
   - Öncelik sırası:
     1) Yerel yatırım konusu soruluyorsa: Yerel Yatırım Konuları Tebliği (il bazlı liste).
     2) Genel teşvik rejimi, bölge, destek unsurları: 9903 Karar (bölgeler, asgari yatırım, destek türleri).
     3) Başvuru şekli, belgeler, E-TUYS işlemleri: 2025/1 Tebliğ.
     4) HIT-30 gibi yüksek teknoloji konuları: HIT30 dokümanı.
     5) Proje bazlı süper teşvikler: 2016/9495 Karar ve 2019/1 Tebliğ.
     6) YTAK ile finansman: YTAK Uygulama Talimatı + YTAK hesap örneği.
   - Aynı soruda birden fazla rejim varsa önce doğru rejimi tespit et, sonra ilgili dosyaya git.

4. ESNEKLİK (AKIŞ SIRASINDA BİLGİ VERME):
   - Kullanıcı akış sırasında bilgi istemek için soru sorarsa (örneğin: “Kütahya kaçıncı bölge?”, “YTAK faizi nasıl hesaplanıyor?”):
     • “Bilgi veremem” deme.
     • İlgili dokümanda (özellikle 9903 Karar ekleri, YTAK Talimatı, Yerel Yatırım Konuları listesi) cevabı bul,
       kısa ve net şekilde açıkla.
     • Sonra akışa kaldığın yerden devam et (örneğin “Şimdi yatırımın hangi ilçede olacağını belirtir misiniz?”).

5. DOSYA SEÇİMİ ve SINIRLARI:
   - Yerel yatırım konuları için ASLA 9903 Karar içinden il listeleriyle tahmin yapma; her zaman Yerel Yatırım Konuları Tebliği’ni satır satır tara.
   - Bölge numarası, asgari yatırım tutarı, destek oranı gibi konularda Tebliğ yerine öncelikle Karar’a bak.
   - Başvuru belgesi, SGK borcu, ÇED, E-TUYS ekranları için Karar’dan ziyade 2025/1 Tebliğ’e bak.
   - YTAK faiz hesapları için 9903 Karar’a değil, YTAK Talimatı ve hesap örneğine bak.

6. CEVAP ÜRETİRKEN:
   - Asla dokümandan satır satır kopyalama yapma; bilgiyi kendi cümlelerinle sadeleştir.
   - Önce kısa bir ÖZET ver, sonra gerekiyorsa madde madde detaylandır.
   - Teşvik sonucunu açıklarken:
     • İl ve ilçe hangi bölge?
     • OSB içi/dışı durumu ne?
     • Varsa yerel yatırım konusu listesinde yer alıp almadığı
     • Seçilen rejime göre (Yerel Kalkınma Hamlesi, bölgesel, HIT-30, proje bazlı vb.) hangi desteklerin çıktığı
       net ve tablo gibi anlaşılır olsun.

7. SON YÖNLENDİRME:
   - Çok detaylı veya özel durumlar için kullanıcının ilindeki Yatırım Destek Ofisi’ne yönlendir.
   - Cevabın sonunda “Detaylı ve güncel yorum için ilinizdeki Yatırım Destek Ofisi ile de iletişime geçmenizi öneririm.” gibi bir not ekleyebilirsin.
`;

    // ⭐ ÖNEMLİ: ŞU AN BİLGİ TOPLAMA MODUNDA MI?
    const isCollecting = incentiveQuery?.status === "collecting";

    const systemPrompt = isCollecting ? baseInstructions + "\n\n" + interactiveInstructions : baseInstructions;

    const normalizedUserMessage = normalizeRegionNumbers(lastUserMessage.content);

    // ⭐ ÖNEMLİ: Bilgi toplama modunda kullanıcı mesajını şişirmiyoruz,
    // sadece normal halini gönderiyoruz. Cevap verme modunda augmented kullanıyoruz.
    const augmentedUserMessage = `
${normalizedUserMessage}

(SİSTEM NOTU: Bu soruyu yanıtlarken File Search aracını kullan. 
Aradığın terimin eş anlamlılarını (synonyms) ve farklı yazılışlarını da sorguya dahil et lütfen.
Eğer bu konu birden fazla ilde, maddede veya listede geçiyorsa, HEPSİNİ eksiksiz listele lütfen. 
Özetleme yapma. Tüm sonuçları getir. Özellikle "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" içinde detaylı arama yap.)
`;

    const userContentForModel = isCollecting
      ? normalizedUserMessage // sohbet/informasyon toplama modu
      : augmentedUserMessage; // full cevap / listeleme modu

    const messagesForGemini = [
      ...messages.slice(0, -1),
      {
        ...lastUserMessage,
        content: userContentForModel,
      },
    ];

    const generationConfig = {
      temperature: isCollecting ? 0.2 : 0.1, // sohbet modunda biraz daha esnek olsun
      maxOutputTokens: isCollecting ? 1024 : 8192,
    };

    console.log("=== Calling Gemini ===");
    console.log("Using Model:", GEMINI_MODEL_NAME, "isCollecting:", isCollecting);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: messagesForGemini
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }))
        .filter((m: any) => {
          if (m.role === "user") return true;
          const txt = m.parts?.[0]?.text || "";
          if (!txt) return true;
          if (txt.includes("tool_code") || txt.includes("file_search.query")) return false;
          return true;
        }),
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

    console.log("📊 Initial Response Analysis:", {
      textLength: textOut.length,
      textPreview: textOut.substring(0, 150),
      chunksCount: groundingChunks.length,
      finishReason,
    });

    // --- BOŞ YANIT / RETRY & FEEDBACK LOOP (senin önceki mantığın aynen korunuyor) ---
    if (!textOut || (textOut.trim().length === 0 && !isCollecting)) {
      // sadece cevap modunda retry mantığını çalıştırıyoruz
      console.warn("⚠️ Empty response detected! Triggering Gemini-powered retry...");

      const retryPrompt = `
🔍 ÖNCEKİ ARAMADA SONUÇ BULUNAMADI - DERİN ARAMA MODUNA GEÇİLİYOR

Kullanıcının Orijinal Sorusu: "${normalizedUserMessage}"

GÖREV:
1. Ana anahtar kelimeyi ve varyasyonlarını çıkar.
2. Bu terimlerle File Search yap, özellikle "ykh_teblig_yatirim_konulari_listesi_yeni.pdf" ve "9903_kararr.pdf" içinde satır satır tara.
3. Bulduğun tüm illeri ve yatırım konularını eksiksiz listele.
4. Hiçbir sonuç yoksa, bunu açıkça belirt ve üst kategori üzerinden yorum yap.
`;

      const retryResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: [
          {
            role: "user",
            parts: [{ text: retryPrompt }],
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          systemInstruction: baseInstructions,
          tools: [{ fileSearch: { fileSearchStoreNames: [storeName] } }],
        },
      });

      const retryResult = extractTextAndChunks(retryResponse);
      console.log("🔄 Retry Result:", {
        textLength: retryResult.textOut.length,
        chunksCount: retryResult.groundingChunks.length,
      });

      if (!retryResult.textOut || retryResult.textOut.trim().length === 0) {
        console.error("❌ Retry failed - returning fallback message");
        return new Response(
          JSON.stringify({
            text: "Üzgünüm, belgelerimde bu konuyla ilgili doğrudan bilgi bulamadım. Lütfen sorunuzu farklı kelimelerle ifade ederek tekrar deneyin veya ilgili Yatırım Destek Ofisi ile iletişime geçin.",
            groundingChunks: [],
            emptyResponse: true,
            retriedWithDynamicSearch: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // enrichment vs. (kısaltarak)
      return new Response(
        JSON.stringify({
          text: retryResult.textOut,
          groundingChunks: retryResult.groundingChunks ?? [],
          retriedWithDynamicSearch: true,
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

    // --- Dosya isimlerini zenginleştirme (kısaltmadan bıraktım) ---
    let enrichedChunks = [];
    if (groundingChunks && groundingChunks.length > 0) {
      const docIds = groundingChunks
        .map((c: any) => {
          const rc = c.retrievedContext ?? {};
          if (rc.documentName) return rc.documentName;
          if (rc.title && rc.title.startsWith("fileSearchStores/")) return rc.title;
          return rc.title ? `${storeName}/documents/${rc.title}` : null;
        })
        .filter((id: string | null): id is string => !!id);

      const uniqueDocIds = [...new Set(docIds)];
      const documentMetadataMap: Record<string, string> = {};
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

      for (const rawId of uniqueDocIds) {
        try {
          const documentName = rawId.startsWith("fileSearchStores/") ? rawId : `${storeName}/documents/${rawId}`;
          const url = `https://generativelanguage.googleapis.com/v1beta/${documentName}?key=${GEMINI_API_KEY}`;

          const docResp = await fetch(url);
          if (docResp.ok) {
            const docData = await docResp.json();
            const customMeta = docData.customMetadata || [];
            const filenameMeta = customMeta.find((m: any) => m.key === "Dosya" || m.key === "fileName");

            if (filenameMeta) {
              const enrichedName = filenameMeta.stringValue || filenameMeta.value || rawId;
              documentMetadataMap[rawId] = enrichedName;
            }
          }
        } catch (e) {
          console.error(`Error fetching metadata for ${rawId}:`, e);
        }
      }

      enrichedChunks = groundingChunks.map((chunk: any) => {
        const rc = chunk.retrievedContext ?? {};
        const rawId = rc.documentName || rc.title || null;
        return {
          ...chunk,
          enrichedFileName: rawId ? (documentMetadataMap[rawId] ?? null) : null,
        };
      });
    }

    const result = {
      text: textOut,
      groundingChunks: enrichedChunks || [],
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
