
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Euro, Banknote } from 'lucide-react';

interface ExchangeRates {
  usd_buying: number;
  eur_buying: number;
  gbp_buying: number;
  date: string;
}

interface CurrencyBadgesProps {
  usdAmount: number;
}

export const CurrencyBadges = ({ usdAmount }: CurrencyBadgesProps) => {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      // First try to get from database
      const { data: dbRates, error: dbError } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (dbRates && !dbError) {
        setRates(dbRates);
        setLoading(false);
        return;
      }

      // If no data in database, fetch from edge function
      const { data: functionData, error: functionError } = await supabase.functions
        .invoke('tcmb-exchange');

      if (functionError) {
        console.error('Error fetching exchange rates:', functionError);
        setLoading(false);
        return;
      }

      // Get the updated rates from database after function call
      const { data: updatedRates } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (updatedRates) {
        setRates(updatedRates);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        <Badge variant="outline" className="animate-pulse">
          <Banknote className="h-3 w-3 mr-1" />
          Loading...
        </Badge>
      </div>
    );
  }

  if (!rates) {
    return (
      <Badge variant="outline">
        <DollarSign className="h-3 w-3 mr-1" />
        ${usdAmount.toLocaleString('en-US')}
      </Badge>
    );
  }

  const tryAmount = usdAmount * rates.usd_buying;
  const eurAmount = usdAmount / rates.eur_buying * rates.usd_buying;
  const gbpAmount = usdAmount / rates.gbp_buying * rates.usd_buying;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <DollarSign className="h-3 w-3 mr-1" />
        ${usdAmount.toLocaleString('en-US')}
      </Badge>
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Banknote className="h-3 w-3 mr-1" />
        ₺{tryAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
      </Badge>
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        <Banknote className="h-3 w-3 mr-1" />
        €{eurAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </Badge>
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <Banknote className="h-3 w-3 mr-1" />
        £{gbpAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </Badge>
    </div>
  );
};
