
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ProvinceRegionMap } from '@/types/database';
import { isEarthquakeAffectedDistrict, isCazibeMerkeziProvince } from '@/utils/regionUtils';

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

        // First, let's check what data exists in the table for debugging
        const { data: allData, error: debugError } = await supabase
          .from('sgk_durations')
          .select('province, district, osb_status, alt_bolge')
          .eq('province', selectedProvince)
          .eq('district', selectedDistrict)
          .eq('osb_status', osbBoolean);
        
        console.log('All matching province data:', allData);
        console.log('Debug error:', debugError);

        // Now try the exact query
        const { data, error } = await supabase
          .from('sgk_durations')
          .select('alt_bolge')
          .eq('province', selectedProvince)
          .ilike('district', selectedDistrict)
          .eq('osb_status', osbBoolean);

        console.log('Query result:', { data, error });

        if (error) {
          console.error('Error fetching alt bolge:', error);
          setAltBolge('');
          return;
        }

        if (data && data.length > 0 && data[0].alt_bolge !== null) {
          const altBolgeText = `${data[0].alt_bolge}. Alt Bölge`;
          console.log('Found alt_bolge:', data[0].alt_bolge);
          setAltBolge(altBolgeText);
        } else {
          console.log('No matching record found for:', {
            province: selectedProvince,
            district: selectedDistrict,
            osb_status: osbBoolean
          });
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
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="province">İl</Label>
          <Select value={selectedProvince} onValueChange={handleProvinceChange} disabled={isLoadingProvinces}>
            <SelectTrigger className="h-11">
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
            <SelectTrigger className="h-11">
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

        <div className="space-y-2">
          <Label>OSB/Endüstri Bölgesi Durumu</Label>
          <RadioGroup 
            value={osbStatus || ''} 
            onValueChange={(value) => handleOsbStatusChange(value as "İÇİ" | "DIŞI")}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="İÇİ" id="osb-ici" />
              <Label htmlFor="osb-ici" className="font-normal text-sm">
                OSB/Endüstri Bölgesi İçinde
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DIŞI" id="osb-disi" />
              <Label htmlFor="osb-disi" className="font-normal text-sm">
                OSB/Endüstri Bölgesi Dışında
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {selectedProvince && (
        <div className="p-3 sm:p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs sm:text-sm">{getProvinceRegion(selectedProvince)}. Bölge</Badge>
            <span className="text-xs sm:text-sm text-muted-foreground">
              <strong>{selectedProvince}</strong> ili
            </span>
            {selectedDistrict && (
              <span className="text-xs sm:text-sm text-muted-foreground">
                - <strong>{selectedDistrict}</strong> ilçesi
              </span>
            )}
            {osbStatus && (
              <span className="text-xs sm:text-sm text-muted-foreground">
                - OSB {osbStatus}
              </span>
            )}
            {isLoadingAltBolge && (
              <Badge variant="outline" className="text-xs">Alt bölge yükleniyor...</Badge>
            )}
            {altBolge && !isLoadingAltBolge && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                {altBolge}
              </Badge>
            )}
            {!altBolge && !isLoadingAltBolge && osbStatus && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs sm:text-sm">
                Alt bölge bulunamadı
              </Badge>
            )}
            {/* Deprem Bölgesi İlçesi Badge */}
            {selectedDistrict && isEarthquakeAffectedDistrict(selectedProvince, selectedDistrict) && (
              <Badge className="bg-amber-500 text-white text-xs sm:text-sm">
                🏗️ Deprem Bölgesi İlçesi
              </Badge>
            )}
            {/* Cazibe Merkezi + OSB İçi Badge */}
            {isCazibeMerkeziProvince(selectedProvince) && osbStatus === "İÇİ" && (
              <Badge className="bg-emerald-500 text-white text-xs sm:text-sm">
                🎯 Cazibe Merkezi - OSB İçi
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelectionStep;
