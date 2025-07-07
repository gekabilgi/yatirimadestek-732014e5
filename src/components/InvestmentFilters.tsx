
import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export interface SmartFilters {
  naceKodlari?: string[];
  hedefUlkeler?: string[];
  ustSektorler?: string[];
  altSektorler?: string[];
  yatirimTutariAraligi?: string;
  kalkinmaAjanslari?: string[];
  iller?: string[];
  skalar?: string[];
}

interface InvestmentFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SmartFilters;
  onFiltersChange: (filters: SmartFilters) => void;
  onApplyFilters: () => void;
}

const ustSektorOptions = [
  { value: 'Sanayi', label: 'Sanayi' },
  { value: 'Tarım', label: 'Tarım' },
  { value: 'Maden', label: 'Maden' },
  { value: 'Enerji', label: 'Enerji' },
  { value: 'Hizmetler', label: 'Hizmetler' }
];

const yatirimTutariOptions = [
  { value: '0-1000000', label: '< 1M TL' },
  { value: '1000000-10000000', label: '1-10M TL' },
  { value: '10000000-50000000', label: '10-50M TL' },
  { value: '50000000-100000000', label: '50-100M TL' },
  { value: '100000000+', label: '> 100M TL' }
];

const kalkinmaAjanslariOptions = [
  'İstanbul Kalkınma Ajansı',
  'Ankara Kalkınma Ajansı',
  'İzmir Kalkınma Ajansı',
  'Trakya Kalkınma Ajansı',
  'Zafer Kalkınma Ajansı',
  'Güney Ege Kalkınma Ajansı',
  'Akdeniz Kalkınma Ajansı',
  'Batı Akdeniz Kalkınma Ajansı',
  'Çukurova Kalkınma Ajansı',
  'Fırat Kalkınma Ajansı',
  'Karacadağ Kalkınma Ajansı',
  'Dicle Kalkınma Ajansı',
  'Doğu Anadolu Kalkınma Ajansı',
  'Kuzeydoğu Anadolu Kalkınma Ajansı',
  'Orta Karadeniz Kalkınma Ajansı',
  'Doğu Karadeniz Kalkınma Ajansı',
  'Batı Karadeniz Kalkınma Ajansı',
  'Kuzey Anadolu Kalkınma Ajansı',
  'Orta Anadolu Kalkınma Ajansı',
  'Ahiler Kalkınma Ajansı',
  'Güney Marmara Kalkınma Ajansı',
  'Bursa Eskişehir Bilecik Kalkınma Ajansı',
  'Doğu Marmara Kalkınma Ajansı',
  'Mevlana Kalkınma Ajansı',
  'Çağ Kalkınma Ajansı',
  'Serhat Kalkınma Ajansı'
].map(name => ({ value: name, label: name }));

const turkishProvinces = [
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
].map(name => ({ value: name, label: name }));

const skaOptions = Array.from({ length: 17 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `SKA ${i + 1}`
}));

export const InvestmentFilters = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  onApplyFilters 
}: InvestmentFiltersProps) => {
  const [naceOptions, setNaceOptions] = useState<MultiSelectOption[]>([]);
  const [hedefUlkeOptions, setHedefUlkeOptions] = useState<MultiSelectOption[]>([]);
  const [altSektorOptions, setAltSektorOptions] = useState<MultiSelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFilterData = async () => {
      setIsLoading(true);
      try {
        // Fetch NACE codes
        const { data: naceData } = await supabase
          .from('nacedortlu')
          .select('nacecode, description')
          .order('nacecode');

        if (naceData) {
          setNaceOptions(naceData.map(item => ({
            value: item.nacecode,
            label: `${item.nacecode} - ${item.description}`,
            description: item.description
          })));
        }

        // Fetch unique target countries from investment reports
        const { data: hedefUlkeData } = await supabase
          .from('investment_feasibility_reports')
          .select('hedef_ulke_tag')
          .not('hedef_ulke_tag', 'is', null);

        if (hedefUlkeData) {
          const uniqueCountries = new Set<string>();
          hedefUlkeData.forEach(item => {
            if (item.hedef_ulke_tag) {
              item.hedef_ulke_tag.split('|').forEach(country => {
                uniqueCountries.add(country.trim());
              });
            }
          });
          
          setHedefUlkeOptions(Array.from(uniqueCountries).map(country => ({
            value: country,
            label: country
          })));
        }

        // Fetch unique alt sectors from investment reports
        const { data: altSektorData } = await supabase
          .from('investment_feasibility_reports')
          .select('alt_sektor_tanim_tag')
          .not('alt_sektor_tanim_tag', 'is', null);

        if (altSektorData) {
          const uniqueSectors = new Set<string>();
          altSektorData.forEach(item => {
            if (item.alt_sektor_tanim_tag) {
              item.alt_sektor_tanim_tag.split('|').forEach(sector => {
                uniqueSectors.add(sector.trim());
              });
            }
          });
          
          setAltSektorOptions(Array.from(uniqueSectors).map(sector => ({
            value: sector,
            label: sector
          })));
        }

      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchFilterData();
    }
  }, [isOpen]);

  const handleFilterChange = (field: keyof SmartFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      Array.isArray(value) ? value.length > 0 : value
    ).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Akıllı Filtreler
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>NACE Kodu ve Tanımı Seçiniz</Label>
                  <MultiSelect
                    options={naceOptions}
                    selected={filters.naceKodlari || []}
                    onChange={(selected) => handleFilterChange('naceKodlari', selected)}
                    placeholder="NACE kodları seçin..."
                    searchPlaceholder="NACE kodu ara..."
                    emptyText="NACE kodu bulunamadı"
                    maxDisplay={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hedef Ülke Seçiniz</Label>
                  <MultiSelect
                    options={hedefUlkeOptions}
                    selected={filters.hedefUlkeler || []}
                    onChange={(selected) => handleFilterChange('hedefUlkeler', selected)}
                    placeholder="Hedef ülkeler seçin..."
                    searchPlaceholder="Ülke ara..."
                    emptyText="Ülke bulunamadı"
                    maxDisplay={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Üst Sektör Seçiniz</Label>
                  <MultiSelect
                    options={ustSektorOptions}
                    selected={filters.ustSektorler || []}
                    onChange={(selected) => handleFilterChange('ustSektorler', selected)}
                    placeholder="Üst sektörler seçin..."
                    searchPlaceholder="Sektör ara..."
                    emptyText="Sektör bulunamadı"
                    maxDisplay={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alt Sektör Seçiniz</Label>
                  <MultiSelect
                    options={altSektorOptions}
                    selected={filters.altSektorler || []}
                    onChange={(selected) => handleFilterChange('altSektorler', selected)}
                    placeholder="Alt sektörler seçin..."
                    searchPlaceholder="Sektör ara..."
                    emptyText="Sektör bulunamadı"
                    maxDisplay={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Yatırım Tutarı Aralığı Seçiniz</Label>
                  <Select
                    value={filters.yatirimTutariAraligi || ''}
                    onValueChange={(value) => handleFilterChange('yatirimTutariAraligi', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tutar aralığı seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      {yatirimTutariOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kalkınma Ajansı Seçiniz</Label>
                  <MultiSelect
                    options={kalkinmaAjanslariOptions}
                    selected={filters.kalkinmaAjanslari || []}
                    onChange={(selected) => handleFilterChange('kalkinmaAjanslari', selected)}
                    placeholder="Kalkınma ajansları seçin..."
                    searchPlaceholder="Ajans ara..."
                    emptyText="Ajans bulunamadı"
                    maxDisplay={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>İl Seçiniz</Label>
                  <MultiSelect
                    options={turkishProvinces}
                    selected={filters.iller || []}
                    onChange={(selected) => handleFilterChange('iller', selected)}
                    placeholder="İller seçin..."
                    searchPlaceholder="İl ara..."
                    emptyText="İl bulunamadı"
                    maxDisplay={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>SKA Seçiniz</Label>
                  <MultiSelect
                    options={skaOptions}
                    selected={filters.skalar || []}
                    onChange={(selected) => handleFilterChange('skalar', selected)}
                    placeholder="SKA hedefleri seçin..."
                    searchPlaceholder="SKA ara..."
                    emptyText="SKA bulunamadı"
                    maxDisplay={3}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="flex-1 sm:flex-initial"
                >
                  Tüm Filtreleri Temizle
                </Button>
                <Button 
                  onClick={onApplyFilters}
                  className="flex-1 sm:flex-initial"
                >
                  Filtreleri Uygula
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
