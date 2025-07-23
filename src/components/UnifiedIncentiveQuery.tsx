import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SectorSearchStep from './steps/SectorSearchStep';
import LocationSelectionStep from './steps/LocationSelectionStep';
import IncentiveResultsStep from './steps/IncentiveResultsStep';
import { SectorSearchData } from '@/types/database';
import { IncentiveResult } from '@/types/incentive';

export interface UnifiedQueryData {
  selectedSector: SectorSearchData | null;
  selectedProvince: string;
  selectedDistrict: string;
  osbStatus: "İÇİ" | "DIŞI" | null;
}

const UnifiedIncentiveQuery: React.FC = () => {
  const [queryData, setQueryData] = useState<UnifiedQueryData>({
    selectedSector: null,
    selectedProvince: '',
    selectedDistrict: '',
    osbStatus: null,
  });
  
  const [incentiveResult, setIncentiveResult] = useState<IncentiveResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const updateQueryData = (updates: Partial<UnifiedQueryData>) => {
    setQueryData(prev => ({ ...prev, ...updates }));
    // Clear results when data changes
    if (incentiveResult) {
      setIncentiveResult(null);
    }
  };

  const handleSectorSelect = (sector: SectorSearchData) => {
    updateQueryData({ selectedSector: sector });
  };

  const handleLocationUpdate = (locationData: {
    province: string;
    district: string;
    osbStatus: "İÇİ" | "DIŞI" | null;
  }) => {
    updateQueryData({
      selectedProvince: locationData.province,
      selectedDistrict: locationData.district,
      osbStatus: locationData.osbStatus,
    });
  };

  const canCalculate = queryData.selectedSector && 
                     queryData.selectedProvince && 
                     queryData.selectedDistrict && 
                     queryData.osbStatus;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sektör Seçimi</CardTitle>
        </CardHeader>
        <CardContent>
          <SectorSearchStep
            selectedSector={queryData.selectedSector}
            onSectorSelect={handleSectorSelect}
            selectedProvince={queryData.selectedProvince}
          />
        </CardContent>
      </Card>

      {queryData.selectedSector && (
        <Card>
          <CardHeader>
            <CardTitle>Lokasyon Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationSelectionStep
              selectedProvince={queryData.selectedProvince}
              selectedDistrict={queryData.selectedDistrict}
              osbStatus={queryData.osbStatus}
              onLocationUpdate={handleLocationUpdate}
            />
          </CardContent>
        </Card>
      )}

      {canCalculate && (
        <IncentiveResultsStep
          queryData={queryData}
          incentiveResult={incentiveResult}
          setIncentiveResult={setIncentiveResult}
          isCalculating={isCalculating}
          setIsCalculating={setIsCalculating}
        />
      )}
    </div>
  );
};

export default UnifiedIncentiveQuery;
