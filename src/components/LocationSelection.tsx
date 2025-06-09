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
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [altBolge, setAltBolge] = useState<string>('');
  const [isLoadingAltBolge, setIsLoadingAltBolge] = useState(false);

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
    const fetchDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        return;
      }

      setIsLoadingDistricts(true);
      try {
        const { data, error } = await supabase
          .from('location_support')
          .select('ilce')
          .eq('il', selectedProvince)
          .order('ilce');

        if (error) {
          console.error('Error fetching districts:', error);
          setDistricts([]);
          return;
        }

        // Extract unique district names
        const uniqueDistricts = [...new Set(data.map(item => item.ilce))];
        setDistricts(uniqueDistricts);
        
        // Reset district selection if current district is not in the new list
        if (selectedDistrict && !uniqueDistricts.includes(selectedDistrict)) {
          onDistrictChange('');
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedProvince, selectedDistrict, onDistrictChange]);

  useEffect(() => {
    const fetchAltBolge = async () => {
      if (!selectedProvince || !selectedDistrict || !osbStatus) {
        setAltBolge('');
        return;
      }

      setIsLoadingAltBolge(true);
      try {
        const osbBoolean = osbStatus === "İÇİ";
        
        const { data, error } = await supabase
          .from('sgk_durations')
          .select('alt_bolge, bolge')
          .eq('province', selectedProvince)
          .eq('district', selectedDistrict)
          .eq('osb_status', osbBoolean)
          .maybeSingle();

        if (error) {
          console.error('Error fetching alt bolge:', error);
          setAltBolge('');
          return;
        }

        if (data) {
          const altBolgeText = data.alt_bolge ? `${data.alt_bolge}. Alt Bölge` : '';
          setAltBolge(altBolgeText);
        } else {
          setAltBolge('');
        }
      } catch (error) {
        console.error('Error fetching alt bolge:', error);
        setAltBolge('');
      } finally {
        setIsLoadingAltBolge(false);
      }
    };

    fetchAltBolge();
  }, [selectedProvince, selectedDistrict, osbStatus]);

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
            disabled={!selectedProvince || isLoadingDistricts}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !selectedProvince 
                  ? "Önce il seçiniz" 
                  : isLoadingDistricts 
                    ? "Yükleniyor..." 
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

        {selectedProvince && selectedDistrict && osbStatus && (
          <div className="p-3 bg-secondary/20 rounded-lg border border-secondary/30">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Alt Bölge Bilgisi</p>
              {isLoadingAltBolge ? (
                <p className="text-sm">Yükleniyor...</p>
              ) : altBolge ? (
                <p className="font-semibold text-sm">{altBolge}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Bu lokasyon için alt bölge bilgisi bulunamadı</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationSelection;
