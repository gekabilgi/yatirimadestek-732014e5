
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncentiveCalculatorForm } from './IncentiveCalculatorForm';
import { IncentiveCalculatorResults } from './IncentiveCalculatorResults';
import { IncentiveCalculatorInputs, IncentiveCalculatorResults as IIncentiveCalculatorResults } from '@/types/incentiveCalculator';
import { calculateIncentives } from '@/utils/incentiveCalculations';
import { useRealtimeCounters } from '@/hooks/useRealtimeCounters';
import { adminSettingsService } from '@/services/adminSettingsService';
import SectorSearchStep from './steps/SectorSearchStep';
import LocationSelectionStep from './steps/LocationSelectionStep';
import { SectorSearchData } from '@/types/database';

const IncentiveTypeCalculator: React.FC = () => {
  const [calculationResults, setCalculationResults] = useState<IIncentiveCalculatorResults | null>(null);
  const [calculationInputs, setCalculationInputs] = useState<IncentiveCalculatorInputs | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubRegionEnabled, setIsSubRegionEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { incrementCounter } = useRealtimeCounters('calculation_clicks');
  
  // Enhanced mode state
  const [selectedSector, setSelectedSector] = useState<SectorSearchData | null>(null);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [osbStatus, setOsbStatus] = useState<"İÇİ" | "DIŞI" | null>(null);

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
        await incrementCounter();
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleEnhancedCalculate = async () => {
    if (!selectedSector || !selectedProvince || !selectedDistrict || !osbStatus) {
      return;
    }

    const inputs: IncentiveCalculatorInputs = {
      incentiveType: 'Local Development Initiative', // Default for enhanced mode
      investmentType: 'İmalat', // Default
      province: selectedProvince,
      district: selectedDistrict,
      osbStatus: osbStatus === "İÇİ" ? 'inside' : 'outside',
      numberOfEmployees: 1, // Default minimum
      landCost: 0,
      constructionCost: 0,
      importedMachineryCost: 0,
      domesticMachineryCost: 0,
      otherExpenses: 0,
      bankInterestRate: 45,
      supportPreference: 'Interest/Profit Share Support',
      loanAmount: 0,
      loanTermMonths: 60,
      taxReductionSupport: 'Yes'
    };

    await handleCalculate(inputs);
  };

  const handleLocationUpdate = (data: { province: string; district: string; osbStatus: "İÇİ" | "DIŞI" | null }) => {
    setSelectedProvince(data.province);
    setSelectedDistrict(data.district);
    setOsbStatus(data.osbStatus);
  };

  // Auto-trigger calculation when all required data is available in enhanced mode
  useEffect(() => {
    if (isSubRegionEnabled && selectedSector && selectedProvince && selectedDistrict && osbStatus) {
      handleEnhancedCalculate();
    }
  }, [selectedSector, selectedProvince, selectedDistrict, osbStatus, isSubRegionEnabled]);

  const handleReset = () => {
    setCalculationResults(null);
    setCalculationInputs(null);
    // Reset enhanced mode state
    setSelectedSector(null);
    setSelectedProvince('');
    setSelectedDistrict('');
    setOsbStatus(null);
  };

  const canCalculateEnhanced = selectedSector && selectedProvince && selectedDistrict && osbStatus;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Türkiye Yüzyılı Teşvikleri Hesaplama</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSettings ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ) : isSubRegionEnabled ? (
            <div className="space-y-6">
              {/* Step 1: Sector Selection */}
              {!selectedSector && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Adım 1: Sektör Seçimi</h3>
                  <SectorSearchStep
                    selectedSector={selectedSector}
                    onSectorSelect={setSelectedSector}
                    selectedProvince={selectedProvince}
                  />
                </div>
              )}

              {/* Step 2: Location Selection */}
              {selectedSector && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Adım 2: Lokasyon Bilgileri</h3>
                  {selectedSector && (
                    <Card className="bg-primary/5 border-primary mb-4">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{selectedSector.sektor}</h4>
                            <p className="text-sm text-muted-foreground">NACE: {selectedSector.nace_kodu}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedSector(null)}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            Değiştir
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <LocationSelectionStep
                    selectedProvince={selectedProvince}
                    selectedDistrict={selectedDistrict}
                    osbStatus={osbStatus}
                    onLocationUpdate={handleLocationUpdate}
                  />
                </div>
              )}

              {/* Loading State */}
              {isCalculating && canCalculateEnhanced && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Teşvikler hesaplanıyor...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <IncentiveCalculatorForm 
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
            />
          )}
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
