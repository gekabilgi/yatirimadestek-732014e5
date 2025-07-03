
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface InvestmentFilters {
  keyword?: string;
  province?: string;
  sector?: string;
  investmentRange?: string;
  scope?: string;
}

interface InvestmentSearchBarProps {
  onSearch: (filters: InvestmentFilters) => void;
  filters: InvestmentFilters;
}

const provinces = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
  'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van',
  'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak',
  'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const investmentRanges = [
  '0-500.000 TL',
  '500.000-1.000.000 TL',
  '1.000.000-5.000.000 TL',
  '5.000.000-10.000.000 TL',
  '10.000.000+ TL'
];

const scopes = [
  'Yerel',
  'Bölgesel',
  'Ulusal',
  'Uluslararası'
];

export const InvestmentSearchBar = ({ onSearch, filters }: InvestmentSearchBarProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [keyword, setKeyword] = useState(filters.keyword || '');
  const [province, setProvince] = useState(filters.province || '');
  const [sector, setSector] = useState(filters.sector || '');
  const [investmentRange, setInvestmentRange] = useState(filters.investmentRange || '');
  const [scope, setScope] = useState(filters.scope || '');

  const handleSearch = () => {
    onSearch({
      keyword: keyword.trim() || undefined,
      province: province || undefined,
      sector: sector.trim() || undefined,
      investmentRange: investmentRange || undefined,
      scope: scope || undefined,
    });
  };

  const clearFilters = () => {
    setKeyword('');
    setProvince('');
    setSector('');
    setInvestmentRange('');
    setScope('');
    onSearch({});
  };

  const activeFiltersCount = [province, sector, investmentRange, scope, keyword].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Yatırım fırsatlarında ara..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtreler
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          <Button onClick={handleSearch}>
            Ara
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="province">İl</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="İl seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {provinces.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sector">Sektör</Label>
                <Input
                  id="sector"
                  placeholder="Sektör adı..."
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="investment-range">Yatırım Tutarı</Label>
                <Select value={investmentRange} onValueChange={setInvestmentRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutar aralığı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {investmentRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scope">Kapsam</Label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kapsam seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {scopes.map((scopeItem) => (
                      <SelectItem key={scopeItem} value={scopeItem}>
                        {scopeItem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Filtreleri Temizle
              </Button>
              <Button onClick={handleSearch}>
                Filtreleri Uygula
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {keyword && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Arama: {keyword}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setKeyword('')}
              />
            </Badge>
          )}
          {province && (
            <Badge variant="secondary" className="flex items-center gap-1">
              İl: {province}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setProvince('')}
              />
            </Badge>
          )}
          {sector && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Sektör: {sector}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setSector('')}
              />
            </Badge>
          )}
          {investmentRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tutar: {investmentRange}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setInvestmentRange('')}
              />
            </Badge>
          )}
          {scope && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Kapsam: {scope}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setScope('')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
