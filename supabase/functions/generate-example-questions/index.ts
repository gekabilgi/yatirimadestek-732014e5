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
    const { storeName } = await req.json();

    if (!storeName) {
      throw new Error("storeName is required");
    }

    console.log(`Generating example questions for store: ${storeName}`);

    const ai = getAiClient();

    const prompt = `Sana yatırım teşvikleri, destek programları ve ilgili mevzuatlarla ilgili dökümanlar verildi. 
Bu dökümanları analiz ederek, kullanıcıların sıkça sorabileceği 6 pratik ve somut örnek soru üret.

Kurallar:
- Sorular Türkçe olmalı
- Her soru maksimum 15 kelime olsun
- Spesifik ve pratik sorular ol (örn: "9903 sayılı kararda hangi destekler var?", "Stratejik yatırım için başvuru şartları nedir?")
- Genel sorulardan kaçın (örn: "Teşvik nedir?" gibi)
- Sadece JSON array formatında dön, başka açıklama ekleme

⚠️ ÖNEMLİ: Oluşturduğun sorular:
- PDF'teki cümlelerle BİREBİR AYNI olmamalı
- Günlük konuşma diline yakın olmalı
- Örnek: "KDV istisnası hangi yatırım harcamaları için geçerlidir?" yerine
  → "Hangi harcamalarım KDV'den muaf olur?"
  → "Hangi giderlerimde KDV ödemem?"
  → "Makine alımında KDV öder miyim?"

Örnek format:
["Soru 1", "Soru 2", "Soru 3", "Soru 4", "Soru 5", "Soru 6"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
            },
          },
        ],
      },
    });

    let jsonText = response.text.trim();
    console.log("Raw AI response:", jsonText);

    // Extract JSON from markdown code blocks
    const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1];
      console.log("Extracted from code block");
    } else {
      // Fallback: extract array directly
      const firstBracket = jsonText.indexOf("[");
      const lastBracket = jsonText.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonText = jsonText.substring(firstBracket, lastBracket + 1);
        console.log("Extracted array directly");
      }
    }

    const questions = JSON.parse(jsonText);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn("No questions generated, returning empty array");
      return new Response(
        JSON.stringify({ questions: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const filteredQuestions = questions.filter(q => typeof q === "string");
    console.log(`Generated ${filteredQuestions.length} example questions`);

    return new Response(
      JSON.stringify({ questions: filteredQuestions }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating example questions:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        questions: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
