import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate embedding using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI Embedding API error:', response.status, error);
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Generate chat response using Lovable AI
async function generateResponse(context: string, question: string, matchedQuestions: string[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const systemPrompt = `Sen Türkiye'deki yatırım teşvikleri konusunda uzman bir asistansın. 
Resmi Soru-Cevap dokümanlarına dayanarak kullanıcı sorularını cevaplıyorsun.

ÖNEMLİ KURALLAR:
1. Sadece sağlanan bilgi bankasındaki bilgilere dayanarak cevap ver
2. Bilgi bankasında tam cevap varsa, o cevabı kullan ve hangi sorudan geldiğini belirt
3. Eğer bilgi bankasında ALAKALI bilgi yoksa, kesinlikle "Üzgünüm, bu konuda bilgi bankamda yeterli bilgi yok. Lütfen başka bir soru sorun." de
4. Asla bilgi bankasında olmayan bilgileri uydurma veya genel bilgilerle cevap verme
5. Cevapları Türkçe, net ve profesyonel bir şekilde ver
6. Mümkünse orijinal soruyu referans göster: "Bu soru 'X' sorusunda cevaplanmış:"`;

  const questionContext = matchedQuestions.length > 0 
    ? `\n\nBenzer Sorular:\n${matchedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const userPrompt = `Bilgi Bankası (Resmi Soru-Cevap Dokümanı):
${context}${questionContext}

Kullanıcı Sorusu: ${question}

Lütfen yukarıdaki bilgi bankasındaki bilgilere dayanarak soruyu cevapla. Eğer bilgi bankasında alakalı bilgi yoksa, kesinlikle "Üzgünüm, bu konuda bilgi bankamda yeterli bilgi yok" de.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more precise answers
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Chat API error:', response.status, error);
    
    if (response.status === 429) {
      throw new Error('Şu anda çok fazla istek var. Lütfen birkaç saniye sonra tekrar deneyin.');
    }
    if (response.status === 402) {
      throw new Error('AI servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
    }
    
    throw new Error(`Chat generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { question } = await req.json();
    
    if (!question || typeof question !== 'string') {
      throw new Error('Geçerli bir soru girin');
    }

    console.log('Processing question:', question);

    // ROUTING LOGIC: Smart 3-layer routing
    const questionLower = question.toLowerCase();
    
    // Layer 1: NACE Code Detection (exact match)
    const nacePattern = /\b[0-9]{2}(?:\.[0-9]{1,2}){0,2}\b/;
    const hasNaceCode = nacePattern.test(question);
    
    // Layer 2: General Question Keywords (go directly to TXT RAG)
    const generalKeywords = [
      'teşvik', 'başvuru', 'nasıl', 'nedir', 'kimler', 'hangi', 'nereye',
      'yerel kalkınma', 'bölgesel', 'destek programı', 'süreç', 'evrak',
      'başvurmak', 'gerekli', 'koşul', 'şart', 'açıklama', 'detay'
    ];
    const hasGeneralKeyword = generalKeywords.some(kw => questionLower.includes(kw));
    
    // Layer 3: Sector Keywords (try CSV, fallback to TXT RAG if low relevance)
    const sectorKeywords = [
      'nace', 'gtip', 'sektor', 'üretim', 'imalat', 'yetiştiriciliği',
      'kümes', 'sera', 'tekstil', 'kimyasal', 'makine', 'gıda',
      'metal', 'plastik', 'elektronik', 'otomotiv', 'inşaat'
    ];
    const hasSectorKeyword = sectorKeywords.some(kw => questionLower.includes(kw));
    
    // Route to CSV only if: has NACE code OR has sector keyword BUT NOT general keyword
    const shouldTryCSV = hasNaceCode || (hasSectorKeyword && !hasGeneralKeyword);
    
    if (shouldTryCSV) {
      console.log('Attempting CSV lookup (NACE code or sector keyword)');
      try {
        const csvLookupResponse = await fetch(`${supabaseUrl}/functions/v1/lookup-nace`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ question }),
        });

        if (csvLookupResponse.ok) {
          const csvResult = await csvLookupResponse.json();
          
          // For exact NACE matches, always return
          if (csvResult.found && hasNaceCode) {
            console.log('CSV exact NACE match found, returning result');
            return new Response(
              JSON.stringify({
                answer: csvResult.answer,
                sources: ['CSV Policy Database'],
                isDisambiguation: csvResult.isDisambiguation || false,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // For fuzzy matches, check if it's a disambiguation or single result
          if (csvResult.found && !csvResult.isDisambiguation) {
            console.log('CSV fuzzy match found, returning result');
            return new Response(
              JSON.stringify({
                answer: csvResult.answer,
                sources: ['CSV Policy Database'],
                isDisambiguation: false,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // If disambiguation with too many results, fallback to TXT RAG
          if (csvResult.isDisambiguation && csvResult.answer.includes('fazla sonuç')) {
            console.log('CSV returned too many results, falling back to TXT RAG');
          }
        }
        console.log('CSV lookup returned no high-confidence results, falling back to TXT RAG');
      } catch (csvError) {
        console.error('CSV lookup error:', csvError);
        console.log('Falling back to TXT RAG due to CSV error');
      }
    } else {
      console.log('General question detected, using TXT RAG directly');
    }

    // FALLBACK: TXT RAG for general questions or when CSV lookup fails
    // Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question);
    console.log('Generated query embedding');

    // Search for similar documents with optimized threshold for Q&A
    const { data: matches, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.4,  // Lower threshold for better recall
        match_count: 10,  // Get more matches to find the best Q&A
      });

    if (searchError) {
      console.error('Search error:', searchError);
      throw new Error('Arama sırasında bir hata oluştu');
    }

    console.log(`Found ${matches?.length || 0} similar documents`);

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({
          answer: 'Üzgünüm, bu konuda bilgi bankamda yeterli bilgi yok. Lütfen başka bir soru sorun.',
          sources: [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract matched questions from metadata
    const matchedQuestions = matches
      .filter((match: any) => match.content.includes('Soru:'))
      .map((match: any) => {
        const questionMatch = match.content.match(/Soru:\s*(.+?)(?=Cevap:|$)/is);
        return questionMatch ? questionMatch[1].trim() : null;
      })
      .filter((q: string | null) => q !== null)
      .slice(0, 3); // Top 3 matched questions

    // Build context from matched documents, prioritizing complete Q&A pairs
    const context = matches
      .slice(0, 5) // Use top 5 matches for context
      .map((match: any) => match.content)
      .join('\n\n---\n\n');

    console.log('Generating response with Q&A context');
    console.log('Matched questions:', matchedQuestions);

    // Generate response using Lovable AI with matched questions
    const answer = await generateResponse(context, question, matchedQuestions);
    console.log('Generated response');

    return new Response(
      JSON.stringify({
        answer,
        sources: matches.slice(0, 5).map((m: any) => ({
          filename: m.filename,
          similarity: m.similarity,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in chat-rag:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Bir hata oluştu',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
