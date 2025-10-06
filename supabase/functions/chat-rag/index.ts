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
async function generateResponse(context: string, question: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const systemPrompt = `Sen Türkçe konuşan yardımcı bir asistansın. Kullanıcının sorularını verilen bağlama göre cevapla. 
Eğer bağlamda cevap yoksa, kibarca bilmediğini söyle ve varsa ilgili konularda yönlendirme yap.
Her zaman Türkçe cevap ver ve nazik ol.`;

  const userPrompt = `Bağlam:
${context}

Soru: ${question}

Lütfen yukarıdaki bağlamı kullanarak soruyu cevapla:`;

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
      temperature: 0.7,
      max_tokens: 1000,
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

    // Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question);
    console.log('Generated query embedding');

    // Search for similar documents with lower threshold
    const { data: matches, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,  // Lowered from 0.7 to 0.5
        match_count: 5,
      });

    if (searchError) {
      console.error('Search error:', searchError);
      throw new Error('Arama sırasında bir hata oluştu');
    }

    console.log(`Found ${matches?.length || 0} similar documents`);

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({
          answer: 'Üzgünüm, bu konuda yeterli bilgim yok. Lütfen başka bir soru sorun veya daha fazla bilgi ekleyin.',
          sources: [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Combine context from matches
    const context = matches
      .map((match: any) => `${match.content} (Kaynak: ${match.filename})`)
      .join('\n\n');

    // Generate response
    const answer = await generateResponse(context, question);
    console.log('Generated response');

    return new Response(
      JSON.stringify({
        answer,
        sources: matches.map((m: any) => ({
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
