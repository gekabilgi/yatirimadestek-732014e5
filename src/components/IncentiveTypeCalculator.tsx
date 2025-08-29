
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncentiveCalculatorForm } from './IncentiveCalculatorForm';
import { IncentiveCalculatorResults } from './IncentiveCalculatorResults';
import { IncentiveCalculatorInputs, IncentiveCalculatorResults as IIncentiveCalculatorResults } from '@/types/incentiveCalculator';
import { calculateIncentives } from '@/utils/incentiveCalculations';
import { useRealtimeCounters } from '@/hooks/useRealtimeCounters';

const IncentiveTypeCalculator: React.FC = () => {
  const [calculationResults, setCalculationResults] = useState<IIncentiveCalculatorResults | null>(null);
  const [calculationInputs, setCalculationInputs] = useState<IncentiveCalculatorInputs | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { incrementCounter } = useRealtimeCounters('calculation_clicks');

  const handleCalculate = async (inputs: IncentiveCalculatorInputs) => {
    setIsCalculating(true);
    try {
      const results = await calculateIncentives(inputs);
      setCalculationResults(results);
      setCalculationInputs(inputs);
      
      // Increment counter on successful calculation
      if (results.isEligible) {
        await incrementCounter();
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Türkiye Yüzyılı Teşvikleri Hesaplama</CardTitle>
        </CardHeader>
        <CardContent>
          <IncentiveCalculatorForm 
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />
        </CardContent>
      </Card>

      {calculationResults && calculationInputs && (
        <IncentiveCalculatorResults 
          results={calculationResults}
          inputs={calculationInputs}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default IncentiveTypeCalculator;
