
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { IncentiveCalculatorInputs } from '@/types/incentiveCalculator';
import { supabase } from '@/integrations/supabase/client';
import { ProvinceRegionMap } from '@/types/database';

interface IncentiveCalculatorFormProps {
  onCalculate: (inputs: IncentiveCalculatorInputs) => void;
  isCalculating: boolean;
}

export const IncentiveCalculatorForm: React.FC<IncentiveCalculatorFormProps> = ({
  onCalculate,
  isCalculating
}) => {
  const [formData, setFormData] = useState<IncentiveCalculatorInputs>({
    incentiveType: 'Technology Initiative',
    province: '',
    numberOfEmployees: 0,
    landCost: 0,
    constructionCost: 0,
    importedMachineryCost: 0,
    domesticMachineryCost: 0,
    otherExpenses: 0,
    bankInterestRate: 45,
    supportPreference: 'Interest/Profit Share Support',
    loanAmount: 0,
    loanTermMonths: 60
  });

  const [provinces, setProvinces] = useState<ProvinceRegionMap[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);

  // Calculate total fixed investment automatically
  const totalFixedInvestment = useMemo(() => {
    return formData.landCost + formData.constructionCost + formData.importedMachineryCost + 
           formData.domesticMachineryCost + formData.otherExpenses;
  }, [formData.landCost, formData.constructionCost, formData.importedMachineryCost, 
      formData.domesticMachineryCost, formData.otherExpenses]);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data, error } = await supabase
          .from('province_region_map')
          .select('*')
          .order('province_name');

        if (error) {
          console.error('Error fetching provinces:', error);
          return;
        }

        setProvinces(data || []);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  const handleInputChange = (field: keyof IncentiveCalculatorInputs, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const isFormValid = formData.province && formData.numberOfEmployees > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="incentiveType">Teşvik Türü</Label>
          <Select 
            value={formData.incentiveType} 
            onValueChange={(value) => handleInputChange('incentiveType', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Teşvik türü seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technology Initiative">Teknoloji Hamlesi</SelectItem>
              <SelectItem value="Local Development Initiative">Yerel Kalkınma  Hamlesi</SelectItem>
              <SelectItem value="Strategic Initiative">Stratejik Hamlesi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">Yatırım İli</Label>
          <Select 
            value={formData.province} 
            onValueChange={(value) => handleInputChange('province', value)}
            disabled={isLoadingProvinces}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingProvinces ? "Yükleniyor..." : "İl seçin"} />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.province_name}>
                  {province.province_name} ({province.region_number}. Bölge)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfEmployees">Çalışan Sayısı</Label>
          <Input
            id="numberOfEmployees"
            type="number"
            min="0"
            value={formData.numberOfEmployees}
            onChange={(e) => handleInputChange('numberOfEmployees', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supportPreference">Destek Tercihi</Label>
          <Select 
            value={formData.supportPreference} 
            onValueChange={(value) => handleInputChange('supportPreference', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Destek türü seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Interest/Profit Share Support">Faiz/Kar Payı Desteği</SelectItem>
              <SelectItem value="Machinery Support">Makine Desteği</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Yatırım Maliyetleri (TL)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="landCost">Arsa/Arazi Maliyeti</Label>
            <Input
              id="landCost"
              type="number"
              min="0"
              value={formData.landCost}
              onChange={(e) => handleInputChange('landCost', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="constructionCost">İnşaat Maliyeti</Label>
            <Input
              id="constructionCost"
              type="number"
              min="0"
              value={formData.constructionCost}
              onChange={(e) => handleInputChange('constructionCost', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="importedMachineryCost">İthal Makine Maliyeti</Label>
            <Input
              id="importedMachineryCost"
              type="number"
              min="0"
              value={formData.importedMachineryCost}
              onChange={(e) => handleInputChange('importedMachineryCost', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domesticMachineryCost">Yerli Makine Maliyeti</Label>
            <Input
              id="domesticMachineryCost"
              type="number"
              min="0"
              value={formData.domesticMachineryCost}
              onChange={(e) => handleInputChange('domesticMachineryCost', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherExpenses">Diğer Giderler</Label>
            <Input
              id="otherExpenses"
              type="number"
              min="0"
              value={formData.otherExpenses}
              onChange={(e) => handleInputChange('otherExpenses', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Total Fixed Investment Display */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold text-blue-900">Toplam Sabit Yatırım Tutarı:</Label>
            <span className="text-lg font-bold text-blue-900">
              {totalFixedInvestment.toLocaleString('tr-TR')} TL
            </span>
          </div>
        </div>
      </div>

      {/* Loan Parameters - Only show if Interest/Profit Share Support is selected */}
      {formData.supportPreference === 'Interest/Profit Share Support' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Kredi Bilgileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Kredi Tutarı (TL)</Label>
              <Input
                id="loanAmount"
                type="number"
                min="0"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankInterestRate">Banka Faiz Oranı (%)</Label>
              <Input
                id="bankInterestRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.bankInterestRate}
                onChange={(e) => handleInputChange('bankInterestRate', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanTermMonths">Kredi Vadesi (Ay)</Label>
              <Input
                id="loanTermMonths"
                type="number"
                min="1"
                value={formData.loanTermMonths}
                onChange={(e) => handleInputChange('loanTermMonths', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          type="submit" 
          disabled={!isFormValid || isCalculating}
          className="w-full md:w-auto"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {isCalculating ? 'Hesaplanıyor...' : 'Hesapla'}
        </Button>
      </div>
    </form>
  );
};
