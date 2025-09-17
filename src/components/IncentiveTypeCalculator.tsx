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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Three Column Layout for Incentive Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technology Initiative Calculator */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Teknoloji Hamlesi
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Yüksek teknoloji yatırımları için
            </p>
          </CardHeader>
          <CardContent>
            {isSubRegionEnabled ? (
              <EnhancedIncentiveCalculatorForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
              />
            ) : (
              <IncentiveCalculatorForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
              />
            )}
          </CardContent>
        </Card>

        {/* Local Development Initiative Calculator */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-center bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Yerel Kalkınma Hamlesi
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Bölgesel kalkınma yatırımları için
            </p>
          </CardHeader>
          <CardContent>
            {isSubRegionEnabled ? (
              <EnhancedIncentiveCalculatorForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
              />
            ) : (
              <IncentiveCalculatorForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
              />
            )}
          </CardContent>
        </Card>

        {/* Strategic Initiative Calculator */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-center bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Stratejik Hamle
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              Stratejik önem taşıyan yatırımlar için
            </p>
          </CardHeader>
          <CardContent>
            {isSubRegionEnabled ? (
              <EnhancedIncentiveCalculatorForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
              />
            ) : (
              <IncentiveCalculatorForm 
                onCalculate={handleCalculate} 
                isCalculating={isCalculating}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {calculationResults && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Hesaplama Sonuçları</CardTitle>
          </CardHeader>
          <CardContent>
            <IncentiveCalculatorResults 
              results={calculationResults}
              inputs={calculationInputs}
              onReset={handleReset}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IncentiveTypeCalculator;