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
  '0-500.000 USD',
  '500.000-1.000.000 USD',
  '1.000.000-5.000.000 USD',
  '5.000.000-10.000.000 USD',
  '10.000.000+ USD'
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
      province: province && province !== 'all' ? province : undefined,
      sector: sector.trim() || undefined,
      investmentRange: investmentRange && investmentRange !== 'all' ? investmentRange : undefined,
      scope: scope && scope !== 'all' ? scope : undefined,
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

  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case 'keyword':
        setKeyword('');
        break;
      case 'province':
        setProvince('');
        break;
      case 'sector':
        setSector('');
        break;
      case 'investmentRange':
        setInvestmentRange('');
        break;
      case 'scope':
        setScope('');
        break;
    }
    
    const newFilters = {
      keyword: filterType === 'keyword' ? undefined : keyword.trim() || undefined,
      province: filterType === 'province' ? undefined : (province && province !== 'all' ? province : undefined),
      sector: filterType === 'sector' ? undefined : sector.trim() || undefined,
      investmentRange: filterType === 'investmentRange' ? undefined : (investmentRange && investmentRange !== 'all' ? investmentRange : undefined),
      scope: filterType === 'scope' ? undefined : (scope && scope !== 'all' ? scope : undefined),
    };
    
    onSearch(newFilters);
  };

  const activeFiltersCount = [
    province && province !== 'all' ? province : '',
    sector,
    investmentRange && investmentRange !== 'all' ? investmentRange : '',
    scope && scope !== 'all' ? scope : '',
    keyword
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Yatırım fırsatlarında ara..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10 h-11 text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-11 justify-center"
          >
            <Filter className="w-4 h-4" />
            Filtreler
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          <Button onClick={handleSearch} className="h-11">
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
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Tümü</SelectItem>
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
                <Label htmlFor="investment-range">Yatırım Tutarı (USD)</Label>
                <Select value={investmentRange} onValueChange={setInvestmentRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutar aralığı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
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
                    <SelectItem value="all">Tümü</SelectItem>
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
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter('keyword')}
              />
            </Badge>
          )}
          {province && province !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              İl: {province}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter('province')}
              />
            </Badge>
          )}
          {sector && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Sektör: {sector}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter('sector')}
              />
            </Badge>
          )}
          {investmentRange && investmentRange !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tutar: {investmentRange}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter('investmentRange')}
              />
            </Badge>
          )}
          {scope && scope !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Kapsam: {scope}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter('scope')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
