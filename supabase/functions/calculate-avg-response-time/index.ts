import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching answered questions to calculate average response time...')

    // Fetch all answered questions with created_at and answer_date
    const { data: answeredQuestions, error } = await supabase
      .from('soru_cevap')
      .select('created_at, answer_date')
      .eq('answered', true)
      .not('answer_date', 'is', null)

    if (error) {
      console.error('Error fetching answered questions:', error)
      throw error
    }

    if (!answeredQuestions || answeredQuestions.length === 0) {
      console.log('No answered questions found')
      return new Response(
        JSON.stringify({ 
          averageResponseTime: '0 saat 0 dakika',
          totalAnswered: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Found ${answeredQuestions.length} answered questions`)

    // Calculate response times in minutes
    const responseTimes = answeredQuestions.map(question => {
      const createdAt = new Date(question.created_at)
      const answeredAt = new Date(question.answer_date)
      const diffInMinutes = (answeredAt.getTime() - createdAt.getTime()) / (1000 * 60)
      return diffInMinutes
    })

    // Calculate average response time in minutes
    const totalMinutes = responseTimes.reduce((sum, time) => sum + time, 0)
    const averageMinutes = totalMinutes / responseTimes.length

    // Convert to hours and minutes
    const hours = Math.floor(averageMinutes / 60)
    const minutes = Math.round(averageMinutes % 60)

    // Format the result
    let formattedTime = ''
    if (hours > 0) {
      formattedTime += `${hours} saat`
      if (minutes > 0) {
        formattedTime += ` ${minutes} dakika`
      }
    } else {
      formattedTime = `${minutes} dakika`
    }

    console.log(`Average response time: ${formattedTime} (${averageMinutes.toFixed(2)} minutes)`)

    return new Response(
      JSON.stringify({ 
        averageResponseTime: formattedTime,
        totalAnswered: answeredQuestions.length,
        averageMinutes: Math.round(averageMinutes)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in calculate-avg-response-time function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})