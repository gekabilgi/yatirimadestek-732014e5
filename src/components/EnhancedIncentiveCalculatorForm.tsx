import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { IncentiveCalculatorInputs } from '@/types/incentiveCalculator';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedIncentiveCalculatorFormProps {
  onCalculate: (inputs: IncentiveCalculatorInputs) => void;
  isCalculating: boolean;
  isSubRegionEnabled: boolean;
}

interface Province {
  id: number;
  name: string;
  region_id: number;
}

interface District {
  id: number;
  name: string;
  province_id: number;
}

const EnhancedIncentiveCalculatorForm: React.FC<EnhancedIncentiveCalculatorFormProps> = ({
  onCalculate,
  isCalculating,
  isSubRegionEnabled
}) => {
  const [formData, setFormData] = useState<IncentiveCalculatorInputs>({
    incentiveType: 'Technology Initiative',
    investmentType: 'İmalat',
    province: '',
    district: '',
    osbStatus: undefined,
    numberOfEmployees: 0,
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
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [showDistrictSelection, setShowDistrictSelection] = useState(false);
  const [showOsbSelection, setShowOsbSelection] = useState(false);

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince && isSubRegionEnabled) {
      // Show district selection for Region 4 and 5
      if (selectedProvince.region_id === 4 || selectedProvince.region_id === 5) {
        setShowDistrictSelection(true);
        fetchDistricts(selectedProvince.id);
      } else {
        setShowDistrictSelection(false);
        setShowOsbSelection(false);
        setFormData(prev => ({ ...prev, district: '', osbStatus: undefined }));
      }
    } else {
      setShowDistrictSelection(false);
      setShowOsbSelection(false);
      setFormData(prev => ({ ...prev, district: '', osbStatus: undefined }));
    }
  }, [selectedProvince, isSubRegionEnabled]);

  const fetchProvinces = async () => {
    try {
      const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProvinces(data || []);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('province_id', provinceId)
        .order('name');
      
      if (error) throw error;
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleProvinceChange = (provinceName: string) => {
    const province = provinces.find(p => p.name === provinceName);
    setSelectedProvince(province || null);
    setFormData(prev => ({ 
      ...prev, 
      province: provinceName,
      district: '',
      osbStatus: undefined
    }));
  };

  const handleDistrictChange = (districtName: string) => {
    setFormData(prev => ({ ...prev, district: districtName }));
    setShowOsbSelection(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const handleInputChange = (field: keyof IncentiveCalculatorInputs, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Incentive Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Teşvik Türü</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.incentiveType}
            onValueChange={(value: string) => handleInputChange('incentiveType', value)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Technology Initiative" id="tech" />
              <Label htmlFor="tech">Teknoloji Hamlesi</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Local Development Initiative" id="local" />
              <Label htmlFor="local">Yerel Kalkınma Hamlesi</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Strategic Initiative" id="strategic" />
              <Label htmlFor="strategic">Stratejik Hamle</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Lokasyon Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Province Selection */}
          <div>
            <Label htmlFor="province">İl</Label>
            <Select value={formData.province} onValueChange={handleProvinceChange}>
              <SelectTrigger>
                <SelectValue placeholder="İl seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={province.name}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District Selection (only for Region 4 and 5 when sub-region is enabled) */}
          {showDistrictSelection && (
            <div>
              <Label htmlFor="district">İlçe</Label>
              <Select value={formData.district || ''} onValueChange={handleDistrictChange}>
                <SelectTrigger>
                  <SelectValue placeholder="İlçe seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.name}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* OSB Status Selection */}
          {showOsbSelection && (
            <div>
              <Label>OSB/Endüstri Bölgesi Durumu</Label>
              <RadioGroup
                value={formData.osbStatus || ''}
                onValueChange={(value: string) => handleInputChange('osbStatus', value)}
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inside" id="osb-inside" />
                  <Label htmlFor="osb-inside">OSB İçi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outside" id="osb-outside" />
                  <Label htmlFor="osb-outside">OSB Dışı</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Type */}
      <Card>
        <CardHeader>
          <CardTitle>Yatırım Türü</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.investmentType}
            onValueChange={(value: string) => handleInputChange('investmentType', value)}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="İmalat" id="imalat" />
              <Label htmlFor="imalat">İmalat</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Diğer" id="diger" />
              <Label htmlFor="diger">Diğer</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Investment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Yatırım Detayları</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numberOfEmployees">Çalışan Sayısı</Label>
            <Input
              id="numberOfEmployees"
              type="number"
              value={formData.numberOfEmployees}
              onChange={(e) => handleInputChange('numberOfEmployees', parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="landCost">Arsa Maliyeti (TL)</Label>
            <Input
              id="landCost"
              type="number"
              value={formData.landCost}
              onChange={(e) => handleInputChange('landCost', parseFloat(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="constructionCost">İnşaat Maliyeti (TL)</Label>
            <Input
              id="constructionCost"
              type="number"
              value={formData.constructionCost}
              onChange={(e) => handleInputChange('constructionCost', parseFloat(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="importedMachineryCost">İthal Makine Maliyeti (TL)</Label>
            <Input
              id="importedMachineryCost"
              type="number"
              value={formData.importedMachineryCost}
              onChange={(e) => handleInputChange('importedMachineryCost', parseFloat(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="domesticMachineryCost">Yerli Makine Maliyeti (TL)</Label>
            <Input
              id="domesticMachineryCost"
              type="number"
              value={formData.domesticMachineryCost}
              onChange={(e) => handleInputChange('domesticMachineryCost', parseFloat(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="otherExpenses">Diğer Giderler (TL)</Label>
            <Input
              id="otherExpenses"
              type="number"
              value={formData.otherExpenses}
              onChange={(e) => handleInputChange('otherExpenses', parseFloat(e.target.value) || 0)}
              min="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Support Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Destek Tercihi</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.supportPreference}
            onValueChange={(value: string) => handleInputChange('supportPreference', value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Interest/Profit Share Support" id="interest" />
              <Label htmlFor="interest">Faiz/Kar Payı Desteği</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Machinery Support" id="machinery" />
              <Label htmlFor="machinery">Makine Desteği</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Loan Details (only if Interest/Profit Share Support is selected) */}
      {formData.supportPreference === 'Interest/Profit Share Support' && (
        <Card>
          <CardHeader>
            <CardTitle>Kredi Detayları</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="loanAmount">Kredi Tutarı (TL)</Label>
              <Input
                id="loanAmount"
                type="number"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', parseFloat(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="loanTermMonths">Kredi Vadesi (Ay)</Label>
              <Input
                id="loanTermMonths"
                type="number"
                value={formData.loanTermMonths}
                onChange={(e) => handleInputChange('loanTermMonths', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="bankInterestRate">Banka Faiz Oranı (%)</Label>
              <Input
                id="bankInterestRate"
                type="number"
                value={formData.bankInterestRate}
                onChange={(e) => handleInputChange('bankInterestRate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax Reduction Support */}
      <Card>
        <CardHeader>
          <CardTitle>Vergi İndirimi Desteği</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.taxReductionSupport}
            onValueChange={(value: string) => handleInputChange('taxReductionSupport', value)}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="tax-yes" />
              <Label htmlFor="tax-yes">Evet</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="tax-no" />
              <Label htmlFor="tax-no">Hayır</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isCalculating} className="w-full">
        {isCalculating ? 'Hesaplanıyor...' : 'Hesapla'}
      </Button>
    </form>
  );
};

export default EnhancedIncentiveCalculatorForm;