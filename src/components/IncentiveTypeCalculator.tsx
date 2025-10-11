import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncentiveCalculatorForm } from '@/components/IncentiveCalculatorForm';
import { EnhancedIncentiveCalculatorForm } from '@/components/EnhancedIncentiveCalculatorForm';
import { IncentiveCalculatorResults } from '@/components/IncentiveCalculatorResults';
import { IncentiveCalculatorInputs, IncentiveCalculatorResults as Results } from '@/types/incentiveCalculator';
import { calculateIncentives } from '@/utils/incentiveCalculations';
import { adminSettingsService } from '@/services/adminSettingsService';
import { supabase } from '@/integrations/supabase/client';

const IncentiveTypeCalculator: React.FC = () => {
  const [calculationResults, setCalculationResults] = useState<Results | null>(null);
  const [calculationInputs, setCalculationInputs] = useState<IncentiveCalculatorInputs | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubRegionEnabled, setIsSubRegionEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await adminSettingsService.getIncentiveCalculationSettings();
      setIsSubRegionEnabled(settings.sub_region_support_enabled === 1);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleCalculate = async (inputs: IncentiveCalculatorInputs) => {
    setIsCalculating(true);
    try {
      const results = await calculateIncentives(inputs);
      setCalculationResults(results);
      setCalculationInputs(inputs);
      
      // Increment counter on successful calculation
      if (results.isEligible) {
        await supabase.rpc('increment_stat', { stat_name_param: 'calculation_clicks' });
        
        // Import toast at the top of file
        const { toast } = await import('@/hooks/use-toast');
        
        // Create notification description based on incentive type
        const getIncentiveTypeText = (type: string): string => {
          switch (type) {
            case 'Technology Initiative':
              return 'Teknoloji Hamlesi';
            case 'Local Development Initiative':
              return 'Yerel Kalkınma Hamlesi';
            case 'Strategic Initiative':
              return 'Stratejik Hamle';
            default:
              return type;
          }
        };
        
        let description = `Teşvik Türü: ${getIncentiveTypeText(inputs.incentiveType)}`;
        
        // If Local Development Initiative, add investment type
        if (inputs.incentiveType === 'Local Development Initiative') {
          description += ` - Yatırım Konusu: ${inputs.investmentType}`;
        }
        
        toast({
          title: "Hesaplama Tamamlandı",
          description: description,
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setCalculationResults(null);
    setCalculationInputs(null);
  };

  if (isLoadingSettings) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Türkiye Yüzyılı Teşvikleri Hesaplama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Türkiye Yüzyılı Teşvikleri Hesaplama</CardTitle>
        </CardHeader>
        <CardContent>
          {!calculationResults ? (
            isSubRegionEnabled ? (
              <EnhancedIncentiveCalculatorForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
              />
            ) : (
              <IncentiveCalculatorForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
              />
            )
          ) : (
            <IncentiveCalculatorResults 
              results={calculationResults}
              inputs={calculationInputs}
              onReset={handleReset}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncentiveTypeCalculator;