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

  // Enhanced PDF generation function with professional design
  const generatePDF = () => {
    if (!incentiveResult) return;

    const doc = new jsPDF();
    
    // Colors
    const primaryColor = [52, 152, 219]; // Blue
    const secondaryColor = [149, 165, 166]; // Gray
    const successColor = [46, 204, 113]; // Green
    const warningColor = [241, 196, 15]; // Yellow
    const textColor = [44, 62, 80]; // Dark Blue Gray
    
    // Helper function to add colored rectangle background
    const addColoredBackground = (x: number, y: number, width: number, height: number, color: number[]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x, y, width, height, 'F');
    };
    
    // Helper function to add section header
    const addSectionHeader = (title: string, y: number, color: number[] = primaryColor) => {
      addColoredBackground(20, y - 2, 170, 8, color);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 22, y + 3);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      return y + 15;
    };
    
    // Header with logo area and title
    addColoredBackground(0, 0, 210, 30, primaryColor);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TESVIK SONUCLARI', 20, 20);
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 140, 20);
    
    let yPosition = 45;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Sector Information Section
    yPosition = addSectionHeader('SEKTOR BILGILERI', yPosition);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Sektor:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(incentiveResult.sector.name, 50, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('NACE Kodu:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(incentiveResult.sector.nace_code, 60, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Minimum Yatirim Tutari:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${incentiveResult.sector.minInvestment?.toLocaleString('tr-TR')} TL`, 85, yPosition);
    yPosition += 15;
    
    // Location Information Section
    yPosition = addSectionHeader('LOKASYON BILGILERI', yPosition);
    
    // Two column layout for location info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Il:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(incentiveResult.location.province, 35, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Ilce:', 100, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(incentiveResult.location.district, 115, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Bolge:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${incentiveResult.location.region}. Bolge`, 45, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('OSB Durumu:', 100, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(incentiveResult.location.osb_status, 130, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('SGK Destek Suresi:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    const sgkText = doc.splitTextToSize(incentiveResult.location.sgk_duration, 100);
    doc.text(sgkText, 70, yPosition);
    yPosition += sgkText.length * 6;
    
    if (incentiveResult.location.subregion) {
      doc.setFont('helvetica', 'bold');
      doc.text('Alt Bolge:', 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(incentiveResult.location.subregion, 55, yPosition);
      yPosition += 8;
    }
    yPosition += 10;
    
    // Investment Types Section with badges
    yPosition = addSectionHeader('YATIRIM TURU', yPosition, successColor);
    
    const types = [];
    if (incentiveResult.sector.isTarget) types.push('Hedef Yatirim');
    if (incentiveResult.sector.isPriority) types.push('Oncelikli Yatirim');
    if (incentiveResult.sector.isHighTech) types.push('Yuksek Teknoloji');
    if (incentiveResult.sector.isMidHighTech) types.push('Orta-Yuksek Teknoloji');
    
    if (types.length > 0) {
      let xPos = 25;
      types.forEach((type, index) => {
        // Create badge-like appearance
        const textWidth = doc.getTextWidth(type) + 6;
        addColoredBackground(xPos, yPosition - 3, textWidth, 7, successColor);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(type, xPos + 3, yPosition + 1);
        xPos += textWidth + 5;
        
        // If badges would overflow, move to next line
        if (xPos > 160) {
          xPos = 25;
          yPosition += 10;
        }
      });
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      yPosition += 15;
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Genel Yatirim', 25, yPosition);
      yPosition += 15;
    }
    
    // General Supports Section
    yPosition = addSectionHeader('GENEL DESTEKLER', yPosition, warningColor);
    
    // Create table-like structure
    const supports = [
      ['KDV Istisnasi', incentiveResult.supports.vat_exemption ? 'Evet' : 'Hayir'],
      ['Gumruk Muafiyeti', incentiveResult.supports.customs_exemption ? 'Evet' : 'Hayir']
    ];
    
    supports.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', 25, yPosition);
      
      // Color code the response
      if (value === 'Evet') {
        doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      } else {
        doc.setTextColor(220, 53, 69); // Red
      }
      doc.setFont('helvetica', 'bold');
      doc.text(value, 80, yPosition);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      yPosition += 8;
    });
    yPosition += 10;
    
    // Target Investment Supports
    if (incentiveResult.sector.isTarget) {
      yPosition = addSectionHeader('HEDEF YATIRIM DESTEKLERI', yPosition, [52, 152, 219]);
      
      const targetSupports = [
        ['Vergi Indirim Destegi YKO', incentiveResult.supports.target_tax_discount !== "N/A" ? formatPercentage(incentiveResult.supports.target_tax_discount) : "N/A"],
        ['Faiz/Kar Payi Destegi Orani', incentiveResult.supports.target_interest_support !== "N/A" ? formatPercentage(incentiveResult.supports.target_interest_support) : "N/A"],
        ['Faiz/Kar Payi Destegi Ust Limit', incentiveResult.supports.target_cap !== "N/A" ? formatCurrency(incentiveResult.supports.target_cap) : "N/A"]
      ];
      
      targetSupports.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(label + ':', 25, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(value, 25, yPosition + 5);
        yPosition += 12;
      });
      yPosition += 5;
    }
    
    // Priority Investment Supports
    if (incentiveResult.sector.isPriority) {
      yPosition = addSectionHeader('ONCELIKLI YATIRIM DESTEKLERI', yPosition, [46, 204, 113]);
      
      const prioritySupports = [
        ['Vergi Indirim Destegi YKO', incentiveResult.supports.priority_tax_discount !== "N/A" ? formatPercentage(incentiveResult.supports.priority_tax_discount) : "N/A"],
        ['Faiz/Kar Payi Destegi Orani', incentiveResult.supports.priority_interest_support !== "N/A" ? formatPercentage(incentiveResult.supports.priority_interest_support) : "N/A"],
        ['Faiz/Kar Payi Destegi Ust Limit', incentiveResult.supports.priority_cap !== "N/A" ? formatCurrency(incentiveResult.supports.priority_cap) : "N/A"],
        ['Sabit Yatirim Tutari Orani Siniri', incentiveResult.supports.priority_cap_ratio !== "N/A" ? formatPercentage(incentiveResult.supports.priority_cap_ratio) : "N/A"]
      ];
      
      prioritySupports.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(label + ':', 25, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(value, 25, yPosition + 5);
        yPosition += 12;
      });
      yPosition += 5;
    }
    
    // Special Conditions
    if (incentiveResult.sector.conditions && yPosition < 250) {
      yPosition = addSectionHeader('OZEL SARTLAR VE KOSULLAR', yPosition, [231, 76, 60]);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const conditionLines = doc.splitTextToSize(incentiveResult.sector.conditions, 160);
      doc.text(conditionLines, 25, yPosition);
      yPosition += conditionLines.length * 5;
    }
    
    // Footer
    const footerY = 280;
    addColoredBackground(0, footerY, 210, 17, secondaryColor);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Bu belge sistem tarafindan otomatik olarak olusturulmustur.', 20, footerY + 6);
    doc.text(`Olusturma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 20, footerY + 12);
    
    // Save the PDF
    const fileName = `tesvik-sonuclari-${incentiveResult.sector.nace_code}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "PDF İndirildi",
      description: "Teşvik sonuçları profesyonel PDF formatında indirildi.",
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
                      <div>Sabit Yatırım Tutarı Oranı Sınırı: {incentiveResult.supports.priority_cap_ratio !== "N/A" ? formatPercentage(incentiveResult.supports.priority_cap_ratio) : "N/A"}</div>
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
