
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Target, Star, Zap, Cpu, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Download } from 'lucide-react';
import { UnifiedQueryData } from '@/components/UnifiedIncentiveQuery';
import { IncentiveResult } from '@/types/incentive';
import { LocationSupport } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface IncentiveResultsStepProps {
  queryData: UnifiedQueryData;
  incentiveResult: IncentiveResult | null;
  setIncentiveResult: (result: IncentiveResult | null) => void;
  isCalculating: boolean;
  setIsCalculating: (calculating: boolean) => void;
}

const IncentiveResultsStep: React.FC<IncentiveResultsStepProps> = ({
  queryData,
  incentiveResult,
  setIncentiveResult,
  isCalculating,
  setIsCalculating,
}) => {
  // Helper function to format percentage
  const formatPercentage = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return `%${(numValue * 100).toFixed(0)}`;
  };

  // Helper function to format currency
  const formatCurrency = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return `${numValue.toLocaleString('tr-TR')} TL`;
  };

  // Enhanced PDF generation function with Turkish UTF-8 support
  const generatePDF = () => {
    if (!incentiveResult) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Add Turkish character support
    doc.setFont('helvetica');
    
    // Helper function to convert Turkish characters for proper display
    const turkishText = (text: string): string => {
      return text
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C');
    };
    
    // Colors for better design
    const primaryBlue = [41, 128, 185];
    const lightGray = [236, 240, 241];
    const darkGray = [52, 73, 94];
    const green = [39, 174, 96];
    const orange = [230, 126, 34];
    
    let yPos = 20;
    
    // Header with blue background
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(turkishText('TESVIK SONUCLARI RAPORU'), 20, 25);
    
    // Date
    doc.setFontSize(10);
    const currentDate = new Date().toLocaleDateString('tr-TR');
    doc.text(turkishText(`Tarih: ${currentDate}`), 150, 32);
    
    yPos = 50;
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    // Section: Sector Information
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(turkishText('1. SEKTOR BILGILERI'), 20, yPos + 5);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(turkishText(`Sektor Adi: ${incentiveResult.sector.name}`), 20, yPos);
    yPos += 7;
    doc.text(turkishText(`NACE Kodu: ${incentiveResult.sector.nace_code}`), 20, yPos);
    yPos += 7;
    doc.text(turkishText(`Minimum Yatirim Tutari: ${incentiveResult.sector.minInvestment?.toLocaleString('tr-TR')} TL`), 20, yPos);
    yPos += 15;
    
    // Investment Types with colored badges
    if (incentiveResult.sector.isTarget || incentiveResult.sector.isPriority || 
        incentiveResult.sector.isHighTech || incentiveResult.sector.isMidHighTech) {
      
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(turkishText('2. YATIRIM TURU'), 20, yPos + 5);
      yPos += 15;
      
      const types = [];
      if (incentiveResult.sector.isTarget) types.push({ text: 'Hedef Yatirim', color: primaryBlue });
      if (incentiveResult.sector.isPriority) types.push({ text: 'Oncelikli Yatirim', color: green });
      if (incentiveResult.sector.isHighTech) types.push({ text: 'Yuksek Teknoloji', color: orange });
      if (incentiveResult.sector.isMidHighTech) types.push({ text: 'Orta-Yuksek Teknoloji', color: [155, 89, 182] });
      
      types.forEach((type, index) => {
        doc.setFillColor(type.color[0], type.color[1], type.color[2]);
        doc.roundedRect(20, yPos - 2, 50, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(turkishText(type.text), 22, yPos + 2);
        yPos += 10;
      });
      
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      yPos += 10;
    }
    
    // Location Information
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(turkishText('3. LOKASYON BILGILERI'), 20, yPos + 5);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(turkishText(`Il: ${incentiveResult.location.province}`), 20, yPos);
    doc.text(turkishText(`Ilce: ${incentiveResult.location.district}`), 100, yPos);
    yPos += 7;
    doc.text(turkishText(`Bolge: ${incentiveResult.location.region}. Bolge`), 20, yPos);
    doc.text(turkishText(`OSB Durumu: ${incentiveResult.location.osb_status}`), 100, yPos);
    yPos += 7;
    
    if (incentiveResult.location.subregion) {
      doc.text(turkishText(`Alt Bolge: ${incentiveResult.location.subregion}`), 20, yPos);
      yPos += 7;
    }
    
    doc.text(turkishText(`SGK Destek Suresi: ${incentiveResult.location.sgk_duration}`), 20, yPos);
    yPos += 15;
    
    // General Supports
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(turkishText('4. GENEL DESTEKLER'), 20, yPos + 5);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const vatStatus = incentiveResult.supports.vat_exemption ? 'EVET' : 'HAYIR';
    const customsStatus = incentiveResult.supports.customs_exemption ? 'EVET' : 'HAYIR';
    
    doc.text(turkishText(`KDV Istisnasi: ${vatStatus}`), 20, yPos);
    doc.text(turkishText(`Gumruk Muafiyeti: ${customsStatus}`), 100, yPos);
    yPos += 15;
    
    // Target Investment Supports
    if (incentiveResult.sector.isTarget) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(turkishText('5. HEDEF YATIRIM DESTEKLERI'), 20, yPos + 5);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const targetTaxDiscount = incentiveResult.supports.target_tax_discount !== "N/A" ? 
        formatPercentage(incentiveResult.supports.target_tax_discount) : "Uygulanmaz";
      const targetInterestSupport = incentiveResult.supports.target_interest_support !== "N/A" ? 
        formatPercentage(incentiveResult.supports.target_interest_support) : "Uygulanmaz";
      const targetCap = incentiveResult.supports.target_cap !== "N/A" ? 
        formatCurrency(incentiveResult.supports.target_cap) : "Uygulanmaz";
      
      doc.text(turkishText(`Vergi Indirim Destegi YKO: ${targetTaxDiscount}`), 20, yPos);
      yPos += 6;
      doc.text(turkishText(`Faiz/Kar Payi Destegi Orani: ${targetInterestSupport}`), 20, yPos);
      yPos += 6;
      doc.text(turkishText(`Faiz/Kar Payi Destegi Ust Limit: ${targetCap}`), 20, yPos);
      yPos += 15;
    }
    
    // Priority Investment Supports
    if (incentiveResult.sector.isPriority) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(turkishText('6. ONCELIKLI YATIRIM DESTEKLERI'), 20, yPos + 5);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const priorityTaxDiscount = incentiveResult.supports.priority_tax_discount !== "N/A" ? 
        formatPercentage(incentiveResult.supports.priority_tax_discount) : "Uygulanmaz";
      const priorityInterestSupport = incentiveResult.supports.priority_interest_support !== "N/A" ? 
        formatPercentage(incentiveResult.supports.priority_interest_support) : "Uygulanmaz";
      const priorityCap = incentiveResult.supports.priority_cap !== "N/A" ? 
        formatCurrency(incentiveResult.supports.priority_cap) : "Uygulanmaz";
      const priorityCapRatio = incentiveResult.supports.priority_cap_ratio !== "N/A" ? 
        formatPercentage(incentiveResult.supports.priority_cap_ratio) : "Uygulanmaz";
      
      doc.text(turkishText(`Vergi Indirim Destegi YKO: ${priorityTaxDiscount}`), 20, yPos);
      yPos += 6;
      doc.text(turkishText(`Faiz/Kar Payi Destegi Orani: ${priorityInterestSupport}`), 20, yPos);
      yPos += 6;
      doc.text(turkishText(`Faiz/Kar Payi Destegi Ust Limit: ${priorityCap}`), 20, yPos);
      yPos += 6;
      doc.text(turkishText(`Sabit Yatirim Tutari Orani Siniri: ${priorityCapRatio}`), 20, yPos);
      yPos += 15;
    }
    
    // Special Conditions
    if (incentiveResult.sector.conditions && yPos < 250) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(turkishText('7. OZEL SARTLAR'), 20, yPos + 5);
      yPos += 15;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const conditionLines = doc.splitTextToSize(turkishText(incentiveResult.sector.conditions), 170);
      doc.text(conditionLines, 20, yPos);
      yPos += conditionLines.length * 4;
    }
    
    // Footer
    doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.rect(0, 270, 210, 27, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(turkishText('Bu rapor sistem tarafindan otomatik olarak olusturulmustur.'), 20, 280);
    doc.text(turkishText(`Olusturma Tarihi: ${new Date().toLocaleString('tr-TR')}`), 20, 287);
    doc.text(turkishText('Detayli bilgi icin ilgili kurumlara basvurunuz.'), 20, 294);
    
    // Save the PDF
    const fileName = `tesvik-raporu-${incentiveResult.sector.nace_code}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "PDF İndirildi",
      description: "Teşvik raporu başarıyla indirildi.",
    });
  };

  const getProvinceRegion = async (provinceName: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('province_region_map')
        .select('region_number')
        .eq('province_name', provinceName)
        .single();

      if (error) {
        console.error('Error fetching province region:', error);
        return 1;
      }

      return data?.region_number || 1;
    } catch (error) {
      console.error('Error fetching province region:', error);
      return 1;
    }
  };

  const getLocationSupport = async (province: string, district: string): Promise<LocationSupport | null> => {
    try {
      const { data, error } = await supabase
        .from('location_support')
        .select('*')
        .eq('il', province)
        .eq('ilce', district)
        .single();

      if (error) {
        console.error('Error fetching location support:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching location support:', error);
      return null;
    }
  };

  const getSgkDuration = async (province: string, district: string, osbStatus: "İÇİ" | "DIŞI"): Promise<string> => {
    try {
      const osbBoolean = osbStatus === "İÇİ";
      
      const { data, error } = await supabase
        .from('sgk_durations')
        .select('sgk_duration')
        .eq('province', province)
        .eq('district', district)
        .eq('osb_status', osbBoolean)
        .maybeSingle();

      if (error) {
        console.error('Error fetching SGK duration:', error);
        return "1. Bölgede OSB/EB Dışı yatırımlarda SGK desteği uygulanmamaktadır";
      }

      if (data?.sgk_duration) {
        return `${data.sgk_duration} yıl`;
      }

      return "1. Bölgede OSB/EB Dışı yatırımlarda SGK desteği uygulanmamaktadır";
    } catch (error) {
      console.error('Error fetching SGK duration:', error);
      return "1. Bölgede OSB/EB Dışı yatırımlarda SGK desteği uygulanmamaktadır";
    }
  };

  const getAltBolge = async (province: string, district: string, osbStatus: "İÇİ" | "DIŞI"): Promise<string> => {
    try {
      const osbBoolean = osbStatus === "İÇİ";
      
      const { data, error } = await supabase
        .from('sgk_durations')
        .select('alt_bolge')
        .eq('province', province)
        .eq('district', district)
        .eq('osb_status', osbBoolean)
        .maybeSingle();

      if (error) {
        console.error('Error fetching alt bolge:', error);
        return "";
      }

      if (data && data.alt_bolge) {
        return `${data.alt_bolge}. Alt Bölge`;
      }

      return "";
    } catch (error) {
      console.error('Error fetching alt bolge:', error);
      return "";
    }
  };

  const calculateIncentives = async () => {
    if (!queryData.selectedSector || !queryData.selectedProvince || !queryData.selectedDistrict || !queryData.osbStatus) {
      return;
    }

    setIsCalculating(true);
    
    try {
      const region = await getProvinceRegion(queryData.selectedProvince);
      const regionKey = `bolge_${region}` as keyof typeof queryData.selectedSector;
      const minInvestment = queryData.selectedSector[regionKey] as number || 0;
      
      const locationSupportData = await getLocationSupport(queryData.selectedProvince, queryData.selectedDistrict);
      const sgkDuration = await getSgkDuration(queryData.selectedProvince, queryData.selectedDistrict, queryData.osbStatus);
      const altBolge = await getAltBolge(queryData.selectedProvince, queryData.selectedDistrict, queryData.osbStatus);
      
      const result: IncentiveResult = {
        sector: {
          nace_code: queryData.selectedSector.nace_kodu,
          name: queryData.selectedSector.sektor,
          isTarget: queryData.selectedSector.hedef_yatirim || false,
          isPriority: queryData.selectedSector.oncelikli_yatirim || false,
          isHighTech: queryData.selectedSector.yuksek_teknoloji || false,
          isMidHighTech: queryData.selectedSector.orta_yuksek_teknoloji || false,
          conditions: queryData.selectedSector.sartlar || "",
          minInvestment: minInvestment
        },
        location: {
          province: queryData.selectedProvince,
          district: queryData.selectedDistrict,
          osb_status: queryData.osbStatus,
          region: region,
          subregion: altBolge,
          sgk_duration: sgkDuration
        },
        supports: {
          vat_exemption: locationSupportData?.kdv_istisnasi || false,
          customs_exemption: locationSupportData?.gumruk_muafiyeti || false,
          target_tax_discount: locationSupportData?.hedef_vergi_indirimi_yko || "N/A",
          target_interest_support: locationSupportData?.hedef_faiz_karpayi_do || "N/A",
          target_cap: locationSupportData?.hedef_faiz_karpayi_ust_limit_tutari || "N/A",
          target_cap_ratio: locationSupportData?.hedef_faiz_karpayi_syt_orani || "N/A",
          priority_tax_discount: locationSupportData?.oncelikli_vergi_indirimi_yko || "N/A",
          priority_interest_support: locationSupportData?.oncelikli_faiz_karpayi_do || "N/A",
          priority_cap: locationSupportData?.oncelikli_faiz_karpayi_ust_limit_tutari || "N/A",
          priority_cap_ratio: locationSupportData?.oncelikli_faiz_karpayi_syt_orani || "N/A"
        }
      };

      setIncentiveResult(result);
      
      toast({
        title: "Hesaplama Tamamlandı",
        description: "Teşvik hesaplaması başarıyla tamamlandı.",
      });
      
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Hata",
        description: "Hesaplama sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (queryData.selectedSector && queryData.selectedProvince && queryData.selectedDistrict && queryData.osbStatus && !incentiveResult) {
      calculateIncentives();
    }
  }, [queryData.selectedSector, queryData.selectedProvince, queryData.selectedDistrict, queryData.osbStatus]);

  if (isCalculating) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Calculator className="h-5 w-5 animate-spin" />
            <span>Teşvikler hesaplanıyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!incentiveResult) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Teşvik Sonuçları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sector Summary */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">{incentiveResult.sector.name}</h4>
                <Badge variant="outline">{incentiveResult.sector.nace_code}</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                {incentiveResult.sector.isTarget && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Hedef Yatırım
                  </Badge>
                )}
                {incentiveResult.sector.isPriority && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Öncelikli Yatırım
                  </Badge>
                )}
                {incentiveResult.sector.isHighTech && (
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Yüksek Teknoloji
                  </Badge>
                )}
                {incentiveResult.sector.isMidHighTech && (
                  <Badge className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    Orta-Yüksek Teknoloji
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Lokasyon:</span>
                  <div className="font-medium">{incentiveResult.location.province} / {incentiveResult.location.district}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Minimum Yatırım Tutarı:</span>
                  <div className="font-medium">{incentiveResult.sector.minInvestment?.toLocaleString('tr-TR')} TL</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Bölge:</span>
                  <div className="font-medium">{incentiveResult.location.region}. Bölge</div>
                </div>
                <div>
                  <span className="text-muted-foreground">SGK Destek Süresi:</span>
                  <div className="font-medium">{incentiveResult.location.sgk_duration}</div>
                </div>
              </div>
              {incentiveResult.location.subregion && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Alt Bölge:</span>
                  <Badge variant="outline" className="ml-2">{incentiveResult.location.subregion}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Support Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Supports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Genel Destekler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">KDV İstisnası</span>
                  {incentiveResult.supports.vat_exemption ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gümrük Muafiyeti</span>
                  {incentiveResult.supports.customs_exemption ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Investment Type Supports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Yatırım Türü Destekleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {incentiveResult.sector.isTarget && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-blue-600">Hedef Yatırım Destekleri</h5>
                    <div className="text-xs space-y-1">
                      <div>Vergi İndirim Desteği Yatırıma Katkı Oranı: {incentiveResult.supports.target_tax_discount !== "N/A" ? formatPercentage(incentiveResult.supports.target_tax_discount) : "N/A"}</div>
                      <div>Faiz/Kar Payı Desteği Oranı: {incentiveResult.supports.target_interest_support !== "N/A" ? formatPercentage(incentiveResult.supports.target_interest_support) : "N/A"}</div>
                      <div>Faiz/Kar Payı Desteği Üst Limit Tutarı: {incentiveResult.supports.target_cap !== "N/A" ? formatCurrency(incentiveResult.supports.target_cap) : "N/A"}</div>
                    </div>
                  </div>
                )}
                
                {incentiveResult.sector.isPriority && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-green-600">Öncelikli Yatırım Destekleri</h5>
                    <div className="text-xs space-y-1">
                      <div>Vergi İndirim Desteği Yatırıma Katkı Oranı: {incentiveResult.supports.priority_tax_discount !== "N/A" ? formatPercentage(incentiveResult.supports.priority_tax_discount) : "N/A"}</div>
                      <div>Faiz/Kar Payı Desteği Oranı: {incentiveResult.supports.priority_interest_support !== "N/A" ? formatPercentage(incentiveResult.supports.priority_interest_support) : "N/A"}</div>
                      <div>Faiz/Kar Payı Desteği Üst Limit Tutarı: {incentiveResult.supports.priority_cap !== "N/A" ? formatCurrency(incentiveResult.supports.priority_cap) : "N/A"}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Warning about Faiz/Kar Payı limit */}
          {((incentiveResult.sector.isTarget && incentiveResult.supports.target_cap_ratio !== "N/A") || 
            (incentiveResult.sector.isPriority && incentiveResult.supports.priority_cap_ratio !== "N/A")) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Önemli Uyarı:</strong> Faiz/Kar Payı Desteği toplam sabit yatırım tutarının{" "}
                {incentiveResult.sector.isTarget && incentiveResult.supports.target_cap_ratio !== "N/A" && 
                  formatPercentage(incentiveResult.supports.target_cap_ratio)}'unu geçemez.
              </AlertDescription>
            </Alert>
          )}

          {incentiveResult.sector.conditions && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h5 className="font-medium text-amber-800 mb-2">Özel Şartlar ve Koşullar:</h5>
              <p className="text-sm text-amber-700">{incentiveResult.sector.conditions}</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button onClick={calculateIncentives} disabled={isCalculating}>
              <Calculator className="h-4 w-4 mr-2" />
              Yeniden Hesapla
            </Button>
            <Button onClick={generatePDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF İndir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncentiveResultsStep;
