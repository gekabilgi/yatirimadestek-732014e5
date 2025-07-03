
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching TCMB exchange rates...');
    
    const xmlUrl = "https://www.tcmb.gov.tr/kurlar/today.xml";
    const response = await fetch(xmlUrl);
    if (!response.ok) throw new Error("Failed to fetch TCMB data");

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");

    const extractRate = (code: string, field: string) => {
      const node = xml.querySelector(`Currency[CurrencyCode="${code}"]`);
      return node?.querySelector(field)?.textContent || null;
    };

    const exchangeData = {
      USD: {
        ForexBuying: extractRate("USD", "ForexBuying"),
        ForexSelling: extractRate("USD", "ForexSelling"),
      },
      EUR: {
        ForexBuying: extractRate("EUR", "ForexBuying"),
        ForexSelling: extractRate("EUR", "ForexSelling"),
      },
      GBP: {
        ForexBuying: extractRate("GBP", "ForexBuying"),
        ForexSelling: extractRate("GBP", "ForexSelling"),
      },
      date: xml.documentElement.getAttribute("Date") || new Date().toISOString().slice(0, 10),
    };

    console.log('Exchange data extracted:', exchangeData);

    // Store in database (upsert - insert or update if exists)
    const { error: upsertError } = await supabase
      .from('exchange_rates')
      .upsert({
        date: exchangeData.date,
        usd_buying: parseFloat(exchangeData.USD.ForexBuying || '0'),
        usd_selling: parseFloat(exchangeData.USD.ForexSelling || '0'),
        eur_buying: parseFloat(exchangeData.EUR.ForexBuying || '0'),
        eur_selling: parseFloat(exchangeData.EUR.ForexSelling || '0'),
        gbp_buying: parseFloat(exchangeData.GBP.ForexBuying || '0'),
        gbp_selling: parseFloat(exchangeData.GBP.ForexSelling || '0'),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'date'
      });

    if (upsertError) {
      console.error('Error storing exchange rates:', upsertError);
      throw new Error('Failed to store exchange rates');
    }

    console.log('Exchange rates stored successfully');

    return new Response(JSON.stringify(exchangeData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching TCMB rates:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch exchange rates", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
