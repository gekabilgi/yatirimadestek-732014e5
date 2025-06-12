
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { IncentiveCalculatorInputs } from '@/types/incentiveCalculator';

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
    bankInterestRate: 15,
    supportPreference: 'Interest/Profit Share Support',
    minimumFixedInvestment: 500000
  });

  const provinces = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
    'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir', 'Urfa', 'Malatya', 'Erzurum',
    'Van', 'Batman', 'Elazığ', 'Sivas', 'Manisa', 'Kahramanmaraş', 'Zonguldak',
    'Trabzon', 'Balıkesir', 'Sakarya', 'Afyon', 'Kütahya', 'Muğla', 'Tekirdağ',
    'Aydın', 'Denizli', 'Kocaeli', 'Hatay', 'Samsun', 'Adapazarı', 'Ordu',
    'Çorum', 'Isparta', 'Uşak', 'Düzce', 'Osmaniye', 'Aksaray', 'Çanakkale',
    'Kırıkkale', 'Nevşehir', 'Niğde', 'Yozgat', 'Kırşehir', 'Karaman', 'Bolu',
    'Kastamonu', 'Sinop', 'Amasya', 'Giresun', 'Artvin', 'Rize', 'Gümüşhane',
    'Bayburt', 'Erzincan', 'Tunceli', 'Bingöl', 'Muş', 'Bitlis', 'Siirt',
    'Şırnak', 'Mardin', 'Kilis', 'Iğdır', 'Ağrı', 'Kars', 'Ardahan'
  ];

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
              <SelectItem value="Technology Initiative">Teknoloji Girişimi</SelectItem>
              <SelectItem value="Local Development Initiative">Yerel Kalkınma Girişimi</SelectItem>
              <SelectItem value="Strategic Initiative">Stratejik Girişim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">Yatırım İli</Label>
          <Select 
            value={formData.province} 
            onValueChange={(value) => handleInputChange('province', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="İl seçin" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
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
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minimumFixedInvestment">Minimum Sabit Yatırım Tutarı (TL)</Label>
        <Input
          id="minimumFixedInvestment"
          type="number"
          min="0"
          value={formData.minimumFixedInvestment}
          onChange={(e) => handleInputChange('minimumFixedInvestment', parseFloat(e.target.value) || 0)}
        />
      </div>

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
