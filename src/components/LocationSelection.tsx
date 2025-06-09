
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProvinceRegionMap } from '@/types/database';

interface LocationSelectionProps {
  selectedProvince: string;
  selectedDistrict: string;
  osbStatus: "İÇİ" | "DIŞI" | null;
  onProvinceChange: (province: string) => void;
  onDistrictChange: (district: string) => void;
  onOsbStatusChange: (status: "İÇİ" | "DIŞI") => void;
}

const LocationSelection: React.FC<LocationSelectionProps> = ({
  selectedProvince,
  selectedDistrict,
  osbStatus,
  onProvinceChange,
  onDistrictChange,
  onOsbStatusChange,
}) => {
  const [provinces, setProvinces] = useState<ProvinceRegionMap[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);

  // Mock districts data - in real implementation, this could also come from database
  const mockDistricts: Record<string, string[]> = {
    "İstanbul": ["Bahçelievler", "Beşiktaş", "Beyoğlu", "Fatih", "Kadıköy", "Şişli", "Üsküdar"],
    "Ankara": ["Altındağ", "Çankaya", "Etimesgut", "Keçiören", "Mamak", "Sincan", "Yenimahalle"],
    "İzmir": ["Balçova", "Bayraklı", "Bornova", "Buca", "Çiğli", "Gaziemir", "Konak"],
    "Bursa": ["Gemlik", "Gürsu", "İnegöl", "Karacabey", "Mudanya", "Nilüfer", "Osmangazi"],
    "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Dilovası", "Gebze", "Gölcük", "İzmit"],
  };

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

  useEffect(() => {
    if (selectedProvince) {
      const provinceDistricts = mockDistricts[selectedProvince] || [];
      setDistricts(provinceDistricts);
      if (selectedDistrict && !provinceDistricts.includes(selectedDistrict)) {
        onDistrictChange('');
      }
    } else {
      setDistricts([]);
    }
  }, [selectedProvince, selectedDistrict, onDistrictChange]);

  const handleProvinceChange = (province: string) => {
    onProvinceChange(province);
    onDistrictChange(''); // Reset district when province changes
  };

  const getProvinceRegion = (provinceName: string): number => {
    const province = provinces.find(p => p.province_name === provinceName);
    return province?.region_number || 1;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Lokasyon Seçimi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="province">İl</Label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange} disabled={isLoadingProvinces}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingProvinces ? "Yükleniyor..." : "İl seçiniz..."} />
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
          <Label htmlFor="district">İlçe</Label>
          <Select 
            value={selectedDistrict} 
            onValueChange={onDistrictChange}
            disabled={!selectedProvince || districts.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !selectedProvince 
                  ? "Önce il seçiniz" 
                  : districts.length === 0 
                    ? "Bu il için ilçe bulunamadı" 
                    : "İlçe seçiniz..."
              } />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>OSB/Endüstri Bölgesi Durumu</Label>
          <RadioGroup 
            value={osbStatus || ''} 
            onValueChange={(value) => onOsbStatusChange(value as "İÇİ" | "DIŞI")}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="İÇİ" id="osb-ici" />
              <Label htmlFor="osb-ici" className="font-normal">
                OSB/Endüstri Bölgesi İçinde
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DIŞI" id="osb-disi" />
              <Label htmlFor="osb-disi" className="font-normal">
                OSB/Endüstri Bölgesi Dışında
              </Label>
            </div>
          </RadioGroup>
        </div>

        {selectedProvince && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedProvince}</strong> ili <strong>{getProvinceRegion(selectedProvince)}. Bölge</strong> kategorisindedir.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationSelection;
