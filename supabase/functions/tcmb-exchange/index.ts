
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { XMLParser } from "npm:fast-xml-parser";

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
    
    const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
    const response = await fetch(TCMB_URL);
    
    if (!response.ok) throw new Error("Failed to fetch TCMB data");

    const xml = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: true,
      parseAttributeValue: true,
    });

    const json = parser.parse(xml);
    const currencies = json.Tarih_Date.Currency;

    const getRate = (code: string) => {
      const found = currencies.find((c: any) => c["@_CurrencyCode"] === code);
      return {
        name: found?.CurrencyName ?? "",
        forexSelling: parseFloat(found?.ForexSelling ?? "0"),
        banknoteSelling: parseFloat(found?.BanknoteSelling ?? "0"),
        forexBuying: parseFloat(found?.ForexBuying ?? "0"),
        banknoteBuying: parseFloat(found?.BanknoteBuying ?? "0"),
      };
    };

    const exchangeData = {
      USD: getRate("USD"),
      EUR: getRate("EUR"),
      GBP: getRate("GBP"),
      CHF: getRate("CHF"),
      date: json.Tarih_Date["@_Date"],
    };

    console.log('Exchange data extracted:', exchangeData);

    // Store in database (upsert - insert or update if exists)
    const { error: upsertError } = await supabase
      .from('exchange_rates')
      .upsert({
        date: exchangeData.date,
        usd_buying: exchangeData.USD.forexBuying,
        usd_selling: exchangeData.USD.forexSelling,
        eur_buying: exchangeData.EUR.forexBuying,
        eur_selling: exchangeData.EUR.forexSelling,
        gbp_buying: exchangeData.GBP.forexBuying,
        gbp_selling: exchangeData.GBP.forexSelling,
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
