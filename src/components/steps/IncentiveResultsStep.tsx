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
import { isIstanbulMiningInvestment, isResGesInvestment, getGesResOverrideValues } from '@/utils/investmentValidation';

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
  // Helper function to format percentage - fixed to not multiply by 100
  const formatPercentage = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return `%${numValue.toFixed(0)}`;
  };

  // Helper function to format currency
  const formatCurrency = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return `${numValue.toLocaleString('tr-TR')} TL`;
  };

  // Helper function to get support values based on business rules
  const getSupportValues = (incentiveResult: IncentiveResult) => {
    const region = incentiveResult.location.region;
    const isTarget = incentiveResult.sector.isTarget;
    const isPriority = incentiveResult.sector.isPriority;
    const isHighTech = incentiveResult.sector.isHighTech;
    const isMidHighTech = incentiveResult.sector.isMidHighTech;
    
    // Check if it's a combination (hedef + any other type)
    const isCombination = isTarget && (isPriority || isHighTech || isMidHighTech);
    
    let targetSupports = {
      taxDiscount: "20", // Always 20% for target investments
      interestSupport: "N/A",
      cap: "N/A"
    };
    
    let prioritySupports = {
      taxDiscount: "30", // Always 20%
      interestSupport: "25", // Always 25%
      cap: "24000000" // Always 24M TL
    };

    // Apply business rules for target supports
    if (isTarget) {
      if ([1, 2, 3].includes(region)) {
        // Regions 1, 2, 3: No interest/profit share support for target
        targetSupports.interestSupport = "N/A";
        targetSupports.cap = "N/A";
      } else if ([4, 5, 6].includes(region)) {
        // Regions 4, 5, 6: Interest/profit share support available
        targetSupports.interestSupport = "25";
        targetSupports.cap = "12000000";
      }
    }

    // Check for GES/RES special case
    if (queryData.selectedSector && isResGesInvestment({
      nace_kodu: queryData.selectedSector.nace_kodu,
      sektor: queryData.selectedSector.sektor
    })) {
      const gesResOverrides = getGesResOverrideValues();
      
      // Override interest support values for both target and priority
      if (targetSupports.interestSupport !== "N/A") {
        targetSupports.interestSupport = gesResOverrides.interestSupport;
        targetSupports.cap = gesResOverrides.interestSupportCap;
      }
      
      prioritySupports.interestSupport = gesResOverrides.interestSupport;
      prioritySupports.cap = gesResOverrides.interestSupportCap;
    }

    return {
      target: targetSupports,
      priority: prioritySupports,
      isCombination
    };
  };

  // Check if we should show Istanbul mining warning
  const shouldShowIstanbulMiningWarning = () => {
    if (!queryData.selectedSector || !queryData.selectedProvince) return false;
    
    return isIstanbulMiningInvestment(
      queryData.selectedProvince,
      queryData.selectedSector.nace_kodu
    );
  };

  // Helper function to convert Turkish characters for PDF
  const convertTurkishChars = (text: string): string => {
    const turkishMap: { [key: string]: string } = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G',
      'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };
    
    return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => turkishMap[match] || match);
  };

  // Enhanced PDF generation function with UTF-8 support
const generatePDF = () => {
    if (!incentiveResult) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Set global style
  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  const gray = [40, 40, 40];
  const blue = [41, 128, 185];
  const green = [46, 204, 113];
  const red = [231, 76, 60];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...gray);

  // HEADER
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text("TEŞVİK SONUÇLARI RAPORU", margin, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth - margin - 40, 20);

  y = 30;

  // SECTOR + NACE
  doc.setTextColor(...gray);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const sectorLines = doc.splitTextToSize(convertTurkishChars(incentiveResult.sector.name), pageWidth - margin * 2 - 40);
  doc.text(sectorLines, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`NACE: ${incentiveResult.sector.nace_code}`, pageWidth - margin - 40, y);

  y += sectorLines.length * 5 + 5;

  // BADGES
  const badges = [];
  if (incentiveResult.sector.isTarget) badges.push("🎯 Hedef Yatırım");
  if (incentiveResult.sector.isPriority) badges.push("📌 Öncelikli");
  if (incentiveResult.sector.isHighTech) badges.push("💡 Yüksek Teknoloji");
  if (incentiveResult.sector.isMidHighTech) badges.push("🔧 Orta-Yüksek Teknoloji");

  if (badges.length) {
    doc.setFont('helvetica', 'normal');
    doc.text(badges.join("   "), margin, y);
    y += 7;
  }

  // LOCATION INFO
  const loc = incentiveResult.location;
  const locInfo = [
    ["Lokasyon", `${loc.province} / ${loc.district}`],
    ["Bölge", `${loc.region}. Bölge`],
    ["Alt Bölge", loc.subregion || "Yok"],
    ["Minimum Yatırım", `${incentiveResult.sector.minInvestment?.toLocaleString('tr-TR')} TL`],
    ["SGK Desteği", loc.sgk_duration]
  ];
  locInfo.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(val, margin + 40, y);
    y += 6;
  });

  y += 4;

  // GENERAL SUPPORTS
  doc.setFont('helvetica', 'bold');
  doc.text("Genel Destekler", margin, y);
  y += 6;
  const supports = incentiveResult.supports;
  const yesNo = val => val ? { txt: "✓ EVET", col: green } : { txt: "✗ HAYIR", col: red };

  [["KDV İstisnası", supports.vat_exemption], ["Gümrük Muafiyeti", supports.customs_exemption]]
    .forEach(([label, val]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text(label, margin, y);
      const status = yesNo(val);
      doc.setTextColor(...status.col);
      doc.text(status.txt, margin + 60, y);
      y += 6;
    });

  y += 4;
  doc.setTextColor(...gray);

  // INVESTMENT TYPE SUPPORTS
  const values = getSupportValues(incentiveResult);
  const investmentTypes = [];

  if (incentiveResult.sector.isTarget) {
    investmentTypes.push(["Hedef Yatırım Destekleri", values.target]);
  }
  if (incentiveResult.sector.isPriority || incentiveResult.sector.isHighTech || incentiveResult.sector.isMidHighTech) {
    investmentTypes.push(["Öncelikli / Teknoloji Destekleri", values.priority]);
  }

  investmentTypes.forEach(([title, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.text(`Vergi İndirimi Katkı Oranı: ${formatPercentage(val.taxDiscount)}`, margin, y);
    y += 5;
    doc.text(`Faiz/Kâr Payı Oranı: ${val.interestSupport.includes("N/A") ? val.interestSupport : formatPercentage(val.interestSupport)}`, margin, y);
    y += 5;
    doc.text(`Faiz/Kâr Payı Üst Limit: ${val.cap.includes("N/A") ? val.cap : formatCurrency(val.cap)}`, margin, y);
    y += 8;
  });

  // IMPORTANT NOTE
  if (incentiveResult.sector.isTarget && [4, 5, 6].includes(loc.region)) {
    doc.setDrawColor(255, 193, 7);
    doc.setFillColor(255, 243, 205);
    doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(133, 100, 4);
    doc.text("⚠ Faiz/Kâr Payı Desteği, sabit yatırımın %10’unu geçemez.", margin + 2, y + 6);
    y += 14;
  }

  // CONDITIONS
  if (incentiveResult.sector.conditions) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text("Özel Şartlar ve Koşullar", margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(convertTurkishChars(incentiveResult.sector.conditions), pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4;
  }

  // FOOTER
  const footerY = 285;
  doc.setFillColor(60, 60, 60);
  doc.rect(0, footerY, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Bu rapor sistem tarafından otomatik olarak oluşturulmuştur.", margin, footerY + 5);
  doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, margin, footerY + 9);

  // Save
  const fileName = `tesvik-raporu-${incentiveResult.sector.nace_code}-${new Date().toISOString().split("T")[0]}.pdf`;
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

  const refreshSearch = () => {
    // Clear all search data and reset to initial state
    setIncentiveResult(null);
    window.location.reload();
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

  // Get support values based on business rules
  const supportValues = getSupportValues(incentiveResult);

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

          {/* Target Sector Interest/Profit Share Support Warning */}
          {incentiveResult.sector.isTarget && [1, 2, 3].includes(incentiveResult.location.region) && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Önemli Bilgi:</strong> Hedef sektörler için Faiz/Kar Payı Desteği 1., 2. ve 3. bölgelerde uygulanmamaktadır.
              </AlertDescription>
            </Alert>
          )}

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
                {/* Show Istanbul Mining Warning instead of support details */}
                {shouldShowIstanbulMiningWarning() ? (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Önemli Uyarı:</strong> Seçilen sektör İstanbul ilinde desteklenmemektedir.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {incentiveResult.sector.isTarget && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-blue-600">Hedef Yatırım Destekleri</h5>
                        <div className="text-xs space-y-1">
                          <div>Vergi İndirim Desteği Yatırıma Katkı Oranı: {formatPercentage(supportValues.target.taxDiscount)}</div>
                          <div>
                            Faiz/Kar Payı Desteği Oranı: {
                              supportValues.target.interestSupport === "N/A" 
                                ? <span className="text-red-600 font-medium">Uygulanmaz (1., 2., 3. Bölge)</span>
                                : supportValues.target.interestSupport.includes("Uygulanmaz") 
                                  ? <span className="text-orange-600 font-medium">{supportValues.target.interestSupport}</span>
                                  : formatPercentage(supportValues.target.interestSupport)
                            }
                          </div>
                          <div>
                            Faiz/Kar Payı Desteği Üst Limit Tutarı: {
                              supportValues.target.cap === "N/A" 
                                ? <span className="text-red-600 font-medium">Uygulanmaz (1., 2., 3. Bölge)</span>
                                : supportValues.target.cap.includes("Uygulanmaz") 
                                  ? <span className="text-orange-600 font-medium">{supportValues.target.cap}</span>
                                  : formatCurrency(supportValues.target.cap)
                            }
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {(incentiveResult.sector.isPriority || incentiveResult.sector.isHighTech || incentiveResult.sector.isMidHighTech) && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-green-600">
                          {incentiveResult.sector.isHighTech || incentiveResult.sector.isMidHighTech 
                            ? "Öncelikli ve Yüksek/Orta-Yüksek Teknoloji Yatırım Destekleri"
                            : "Öncelikli Yatırım Destekleri"
                          }
                        </h5>
                        <div className="text-xs space-y-1">
                          <div>Vergi İndirim Desteği Yatırıma Katkı Oranı: {formatPercentage(supportValues.priority.taxDiscount)}</div>
                          <div>
                            Faiz/Kar Payı Desteği Oranı: {
                              supportValues.priority.interestSupport.includes("Uygulanmaz") 
                                ? <span className="text-orange-600 font-medium">{supportValues.priority.interestSupport}</span>
                                : formatPercentage(supportValues.priority.interestSupport)
                            }
                          </div>
                          <div>
                            Faiz/Kar Payı Desteği Üst Limit Tutarı: {
                              supportValues.priority.cap.includes("Uygulanmaz") 
                                ? <span className="text-orange-600 font-medium">{supportValues.priority.cap}</span>
                                : formatCurrency(supportValues.priority.cap)
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Warning about Faiz/Kar Payı limit with yellow background - only for target sectors in regions 4,5,6 and not Istanbul mining */}
          {incentiveResult.sector.isTarget && [4, 5, 6].includes(incentiveResult.location.region) && !shouldShowIstanbulMiningWarning() && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Önemli Uyarı:</strong> Faiz/Kar Payı Desteği toplam sabit yatırım tutarının %10'unu geçemez.
                  </p>
                </div>
              </div>
            </div>
          )}

          {incentiveResult.sector.conditions && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h5 className="font-medium text-amber-800 mb-2">Özel Şartlar ve Koşullar:</h5>
              <p className="text-sm text-amber-700">{incentiveResult.sector.conditions}</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button onClick={refreshSearch} disabled={isCalculating}>
              <Calculator className="h-4 w-4 mr-2" />
              Yeni Arama
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
