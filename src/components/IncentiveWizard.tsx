
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import SectorSearch from './SectorSearch';
import LocationSelection from './LocationSelection';
import IncentiveResults from './IncentiveResults';
import { SectorData, WizardData, IncentiveResult, LocationData } from '@/types/incentive';
import { getProvinceRegion } from '@/utils/provinceRegionMap';
import { toast } from '@/hooks/use-toast';

const IncentiveWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    selectedSector: null,
    selectedProvince: '',
    selectedDistrict: '',
    osbStatus: null,
  });
  const [incentiveResult, setIncentiveResult] = useState<IncentiveResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const totalSteps = 3;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const stepTitles = [
    'Sektör Seçimi',
    'Lokasyon Bilgileri',
    'Teşvik Sonuçları'
  ];

  const handleSectorSelect = (sector: SectorData) => {
    setWizardData(prev => ({ ...prev, selectedSector: sector }));
  };

  const handleProvinceChange = (province: string) => {
    setWizardData(prev => ({ ...prev, selectedProvince: province, selectedDistrict: '' }));
  };

  const handleDistrictChange = (district: string) => {
    setWizardData(prev => ({ ...prev, selectedDistrict: district }));
  };

  const handleOsbStatusChange = (status: "İÇİ" | "DIŞI") => {
    setWizardData(prev => ({ ...prev, osbStatus: status }));
  };

  const canProceedToStep2 = wizardData.selectedSector !== null;
  
  const canProceedToStep3 = wizardData.selectedProvince && 
                           wizardData.selectedDistrict && 
                           wizardData.osbStatus;

  const calculateIncentives = async () => {
    if (!canProceedToStep3 || !wizardData.selectedSector) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const region = getProvinceRegion(wizardData.selectedProvince);
      const minInvestment = wizardData.selectedSector[`${region}. Bolge` as keyof SectorData] as number;
      
      // Mock location data - in real implementation, fetch from database
      const mockLocationData: LocationData = {
        il: wizardData.selectedProvince,
        ilce: wizardData.selectedDistrict,
        alt_bolge: `${region}. Alt Bölge`,
        kdv_istisnasi: true,
        gumruk_muafiyeti: true,
        oncelikli_vergi_indirimi_yko: "%40",
        oncelikli_faiz_karpayi_do: "%5",
        oncelikli_faiz_karpayi_ust_limit_tutari: "1.500.000 TL",
        oncelikli_faiz_karpayi_syt_orani: "%10",
        hedef_vergi_indirimi_yko: "%50",
        hedef_faiz_karpayi_do: "%7",
        hedef_faiz_karpayi_ust_limit_tutari: "2.000.000 TL",
        hedef_faiz_karpayi_syt_orani: "%15",
        sgk_destek_suresi: "6 yıl"
      };

      const result: IncentiveResult = {
        sector: {
          nace_code: wizardData.selectedSector.nace_kodu,
          name: wizardData.selectedSector.sektor,
          isTarget: wizardData.selectedSector.hedef_yatirim === "Evet",
          isPriority: wizardData.selectedSector.oncelikli_yatirim === "Evet",
          isHighTech: wizardData.selectedSector.yuksek_teknoloji === "Evet",
          isMidHighTech: wizardData.selectedSector.orta_yuksek_teknoloji === "Evet",
          conditions: wizardData.selectedSector.sartlar,
          minInvestment: minInvestment
        },
        location: {
          province: wizardData.selectedProvince,
          district: wizardData.selectedDistrict,
          osb_status: wizardData.osbStatus!,
          region: region,
          subregion: mockLocationData.alt_bolge,
          sgk_duration: mockLocationData.sgk_destek_suresi
        },
        supports: {
          vat_exemption: mockLocationData.kdv_istisnasi,
          customs_exemption: mockLocationData.gumruk_muafiyeti,
          target_tax_discount: mockLocationData.hedef_vergi_indirimi_yko,
          target_interest_support: mockLocationData.hedef_faiz_karpayi_do,
          target_cap: mockLocationData.hedef_faiz_karpayi_ust_limit_tutari,
          target_cap_ratio: mockLocationData.hedef_faiz_karpayi_syt_orani,
          priority_tax_discount: mockLocationData.oncelikli_vergi_indirimi_yko,
          priority_interest_support: mockLocationData.oncelikli_faiz_karpayi_do,
          priority_cap: mockLocationData.oncelikli_faiz_karpayi_ust_limit_tutari,
          priority_cap_ratio: mockLocationData.oncelikli_faiz_karpayi_syt_orani
        }
      };

      setIncentiveResult(result);
      setCurrentStep(3);
      
      toast({
        title: "Hesaplama Tamamlandı",
        description: "Teşvik hesaplaması başarıyla tamamlandı.",
      });
      
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Hata",
        description: "Hesaplama sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !canProceedToStep2) {
      toast({
        title: "Sektör Seçimi Gerekli",
        description: "Devam etmek için bir sektör seçin.",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 2) {
      calculateIncentives();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setWizardData({
      selectedSector: null,
      selectedProvince: '',
      selectedDistrict: '',
      osbStatus: null,
    });
    setIncentiveResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Calculator className="h-6 w-6" />
            Yatırım Teşvik Hesaplama Sihirbazı
          </CardTitle>
          <p className="text-muted-foreground">
            9903 Sayılı Kararnameye göre yatırım teşviklerinizi hesaplayın
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Adım {currentStep} / {totalSteps}: {stepTitles[currentStep - 1]}
              </span>
              <span className="text-sm text-muted-foreground">
                %{Math.round(progressPercentage)} tamamlandı
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <SectorSearch
            onSectorSelect={handleSectorSelect}
            selectedSector={wizardData.selectedSector}
          />
        )}

        {currentStep === 2 && (
          <LocationSelection
            selectedProvince={wizardData.selectedProvince}
            selectedDistrict={wizardData.selectedDistrict}
            osbStatus={wizardData.osbStatus}
            onProvinceChange={handleProvinceChange}
            onDistrictChange={handleDistrictChange}
            onOsbStatusChange={handleOsbStatusChange}
          />
        )}

        {currentStep === 3 && incentiveResult && (
          <IncentiveResults result={incentiveResult} />
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? resetWizard : prevStep}
              disabled={isCalculating}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Sıfırla' : 'Geri'}
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                disabled={(currentStep === 1 && !canProceedToStep2) || 
                         (currentStep === 2 && (!canProceedToStep3 || isCalculating))}
              >
                {currentStep === 2 ? (
                  isCalculating ? 'Hesaplanıyor...' : 'Hesapla'
                ) : (
                  'İleri'
                )}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={resetWizard}>
                Yeni Hesaplama
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncentiveWizard;
