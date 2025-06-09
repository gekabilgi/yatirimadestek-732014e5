import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ProvinceRegionMap } from '@/types/database';

interface LocationSelectionStepProps {
  selectedProvince: string;
  selectedDistrict: string;
  osbStatus: "İÇİ" | "DIŞI" | null;
  onLocationUpdate: (data: {
    province: string;
    district: string;
    osbStatus: "İÇİ" | "DIŞI" | null;
  }) => void;
}

const LocationSelectionStep: React.FC<LocationSelectionStepProps> = ({
  selectedProvince,
  selectedDistrict,
  osbStatus,
  onLocationUpdate,
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

        const uniqueDistricts = [...new Set(data.map(item => item.ilce))];
        setDistricts(uniqueDistricts);
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    const fetchAltBolge = async () => {
      if (!selectedProvince || !selectedDistrict || !osbStatus) {
        setAltBolge('');
        return;
      }

      setIsLoadingAltBolge(true);
      try {
        const osbBoolean = osbStatus === "İÇİ";
        
        console.log('Fetching alt_bolge for:', {
          province: selectedProvince,
          district: selectedDistrict,
          osb_status: osbBoolean
        });

        // First, let's see what data exists in the table
        const { data: allData, error: allError } = await supabase
          .from('sgk_durations')
          .select('*')
          .limit(10);

        console.log('Sample data from sgk_durations table:', { allData, allError });

        // Now try to find matching records
        const { data, error } = await supabase
          .from('sgk_durations')
          .select('alt_bolge, province, district, osb_status')
          .eq('province', selectedProvince)
          .eq('district', selectedDistrict)
          .eq('osb_status', osbBoolean);

        console.log('Alt bolge query result:', { data, error });
        console.log('Query parameters used:', {
          province: selectedProvince,
          district: selectedDistrict,
          osb_status: osbBoolean
        });

        if (error) {
          console.error('Error fetching alt bolge:', error);
          setAltBolge('');
          return;
        }

        if (data && data.length > 0 && data[0].alt_bolge !== null) {
          const altBolgeText = `${data[0].alt_bolge}. Alt Bölge`;
          console.log('Setting alt bolge to:', altBolgeText);
          setAltBolge(altBolgeText);
        } else {
          // Try partial matching to see if there are similar records
          console.log('No exact match found, checking for similar records...');
          
          const { data: similarData, error: similarError } = await supabase
            .from('sgk_durations')
            .select('*')
            .ilike('province', `%${selectedProvince}%`)
            .ilike('district', `%${selectedDistrict}%`);

          console.log('Similar records found:', { similarData, similarError });

          // Also try with trimmed values in case there are whitespace issues
          const { data: trimmedData, error: trimmedError } = await supabase
            .from('sgk_durations')
            .select('alt_bolge, province, district, osb_status')
            .eq('province', selectedProvince.trim())
            .eq('district', selectedDistrict.trim())
            .eq('osb_status', osbBoolean);

          console.log('Trimmed query result:', { trimmedData, trimmedError });

          if (trimmedData && trimmedData.length > 0 && trimmedData[0].alt_bolge !== null) {
            const altBolgeText = `${trimmedData[0].alt_bolge}. Alt Bölge`;
            console.log('Setting alt bolge from trimmed query to:', altBolgeText);
            setAltBolge(altBolgeText);
          } else {
            console.log('No alt bolge data found in any query variant');
            setAltBolge('');
          }
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
    // Reset district and OSB status when province changes
    onLocationUpdate({
      province,
      district: '',
      osbStatus: null,
    });
  };

  const handleDistrictChange = (district: string) => {
    // Reset OSB status when district changes to ensure fresh calculation
    onLocationUpdate({
      province: selectedProvince,
      district,
      osbStatus: null,
    });
  };

  const handleOsbStatusChange = (status: "İÇİ" | "DIŞI") => {
    onLocationUpdate({
      province: selectedProvince,
      district: selectedDistrict,
      osbStatus: status,
    });
  };

  const getProvinceRegion = (provinceName: string): number => {
    const province = provinces.find(p => p.province_name === provinceName);
    return province?.region_number || 1;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            onValueChange={handleDistrictChange}
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
      </div>

      <div className="space-y-3">
        <Label>OSB/Endüstri Bölgesi Durumu</Label>
        <RadioGroup 
          value={osbStatus || ''} 
          onValueChange={(value) => handleOsbStatusChange(value as "İÇİ" | "DIŞI")}
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
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{getProvinceRegion(selectedProvince)}. Bölge</Badge>
            <span className="text-sm text-muted-foreground">
              <strong>{selectedProvince}</strong> ili
            </span>
            {selectedDistrict && (
              <span className="text-sm text-muted-foreground">
                - <strong>{selectedDistrict}</strong> ilçesi
              </span>
            )}
            {osbStatus && (
              <span className="text-sm text-muted-foreground">
                - OSB {osbStatus}
              </span>
            )}
            {isLoadingAltBolge && (
              <Badge variant="outline">Alt bölge yükleniyor...</Badge>
            )}
            {altBolge && !isLoadingAltBolge && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {altBolge}
              </Badge>
            )}
            {!altBolge && !isLoadingAltBolge && osbStatus && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Alt bölge bulunamadı
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelectionStep;
