
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncentiveCalculatorForm } from './IncentiveCalculatorForm';
import { IncentiveCalculatorResults } from './IncentiveCalculatorResults';
import { IncentiveCalculatorInputs, IncentiveCalculatorResults as IIncentiveCalculatorResults } from '@/types/incentiveCalculator';
import { calculateIncentives } from '@/utils/incentiveCalculations';

const IncentiveTypeCalculator: React.FC = () => {
  const [calculationResults, setCalculationResults] = useState<IIncentiveCalculatorResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async (inputs: IncentiveCalculatorInputs) => {
    setIsCalculating(true);
    try {
      const results = calculateIncentives(inputs);
      setCalculationResults(results);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setCalculationResults(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teşvik Türü Bazlı Destek Hesaplayıcısı</CardTitle>
        </CardHeader>
        <CardContent>
          <IncentiveCalculatorForm 
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />
        </CardContent>
      </Card>

      {calculationResults && (
        <IncentiveCalculatorResults 
          results={calculationResults}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default IncentiveTypeCalculator;
