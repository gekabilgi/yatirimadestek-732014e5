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

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add UTF-8 font support
    doc.setFont('helvetica');
    doc.setCharSpace(0.1);
    
    const primaryBlue = [52, 152, 219];
    const lightGray = [245, 245, 245];
    const darkGray = [44, 62, 80];
    const green = [46, 204, 113];
    const orange = [230, 126, 34];
    const purple = [155, 89, 182];
    const red = [231, 76, 60];
    
    let yPos = 15;
    const pageWidth = 210;
    const pageHeight = 297;
    const leftMargin = 15;
    const rightMargin = 15;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // Header with gradient effect
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Title with UTF-8 support
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(convertTurkishChars('TESVİK SONUÇLARI RAPORU'), leftMargin, 20);
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('tr-TR');
    doc.text(convertTurkishChars(`Tarih: ${currentDate}`), pageWidth - rightMargin - 40, 28);
    
    yPos = 45;
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    // Sector title with NACE code badge
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(convertTurkishChars(incentiveResult.sector.name), leftMargin, yPos);
    
    // NACE code badge
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(pageWidth - rightMargin - 35, yPos - 6, 30, 8, 2, 2, 'F');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(incentiveResult.sector.nace_code, pageWidth - rightMargin - 30, yPos - 1);
    
    yPos += 15;
    
    // Investment type badges
    let badgeX = leftMargin;
    const badgeY = yPos;
    const badgeHeight = 6;
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    if (incentiveResult.sector.isTarget) {
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.roundedRect(badgeX, badgeY, 30, badgeHeight, 2, 2, 'F');
      doc.text(convertTurkishChars('Hedef Yatirim'), badgeX + 2, badgeY + 4);
      badgeX += 35;
    }
    
    if (incentiveResult.sector.isPriority) {
      doc.setFillColor(green[0], green[1], green[2]);
      doc.roundedRect(badgeX, badgeY, 35, badgeHeight, 2, 2, 'F');
      doc.text(convertTurkishChars('Oncelikli Yatirim'), badgeX + 2, badgeY + 4);
      badgeX += 40;
    }
    
    if (incentiveResult.sector.isHighTech) {
      doc.setFillColor(orange[0], orange[1], orange[2]);
      doc.roundedRect(badgeX, badgeY, 35, badgeHeight, 2, 2, 'F');
      doc.text(convertTurkishChars('Yuksek Teknoloji'), badgeX + 2, badgeY + 4);
      badgeX += 40;
    }
    
    if (incentiveResult.sector.isMidHighTech) {
      doc.setFillColor(purple[0], purple[1], purple[2]);
      doc.roundedRect(badgeX, badgeY, 45, badgeHeight, 2, 2, 'F');
      doc.text(convertTurkishChars('Orta-Yuksek Teknoloji'), badgeX + 2, badgeY + 4);
    }
    
    yPos += 20;
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    // Location and minimum investment info in grid
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text(convertTurkishChars('Lokasyon:'), leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(convertTurkishChars(`${incentiveResult.location.province} / ${incentiveResult.location.district}`), leftMargin + 25, yPos);
    
    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text(convertTurkishChars('Minimum Yatirim Tutari:'), leftMargin + 100, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(convertTurkishChars(`${incentiveResult.sector.minInvestment?.toLocaleString('tr-TR')} TL`), leftMargin + 150, yPos);
    
    yPos += 8;
    
    // Region info
    doc.setFont('helvetica', 'bold');
    doc.text(convertTurkishChars('Bolge:'), leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(convertTurkishChars(`${incentiveResult.location.region}. Bolge`), leftMargin + 25, yPos);
    
    // SGK info
    doc.setFont('helvetica', 'bold');
    doc.text(convertTurkishChars('SGK Destek Suresi:'), leftMargin + 100, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(convertTurkishChars(incentiveResult.location.sgk_duration), leftMargin + 150, yPos);
    
    yPos += 10;
    
    // Sub-region if exists
    if (incentiveResult.location.subregion) {
      doc.setFont('helvetica', 'bold');
      doc.text(convertTurkishChars('Alt Bolge:'), leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(convertTurkishChars(incentiveResult.location.subregion), leftMargin + 25, yPos);
      yPos += 10;
    }
    
    // General Supports section
    yPos += 5;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(leftMargin, yPos, contentWidth, 20, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(convertTurkishChars('Genel Destekler'), leftMargin + 5, yPos + 7);
    
    // Support status indicators
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // VAT Exemption
    doc.text(convertTurkishChars('KDV Istisnas'), leftMargin + 5, yPos);
    if (incentiveResult.supports.vat_exemption) {
      doc.setTextColor(green[0], green[1], green[2]);
      doc.text(convertTurkishChars('✓ EVET'), leftMargin + 50, yPos);
    } else {
      doc.setTextColor(red[0], red[1], red[2]);
      doc.text(convertTurkishChars('✗ HAYIR'), leftMargin + 50, yPos);
    }
    
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    // Customs Exemption
    doc.text(convertTurkishChars('Gumruk Muafiyeti'), leftMargin + 100, yPos);
    if (incentiveResult.supports.customs_exemption) {
      doc.setTextColor(green[0], green[1], green[2]);
      doc.text(convertTurkishChars('✓ EVET'), leftMargin + 150, yPos);
    } else {
      doc.setTextColor(red[0], red[1], red[2]);
      doc.text(convertTurkishChars('✗ HAYIR'), leftMargin + 150, yPos);
    }
    
    yPos += 20;
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    // Investment Type Supports section
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(leftMargin, yPos, contentWidth, 8, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(convertTurkishChars('Yatirim Turu Destekleri'), leftMargin + 5, yPos + 5);
    
    yPos += 15;
    
    // Target Investment Supports
    if (incentiveResult.sector.isTarget) {
      doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.rect(leftMargin, yPos, contentWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(convertTurkishChars('Hedef Yatirim Destekleri'), leftMargin + 5, yPos + 4);
      
      yPos += 10;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const targetTaxDiscount = incentiveResult.supports.target_tax_discount !== "N/A" ? 
        formatPercentage(incentiveResult.supports.target_tax_discount) : "Uygulanmaz";
      const targetInterestSupport = incentiveResult.supports.target_interest_support !== "N/A" ? 
        formatPercentage(incentiveResult.supports.target_interest_support) : "Uygulanmaz";
      const targetCap = incentiveResult.supports.target_cap !== "N/A" ? 
        formatCurrency(incentiveResult.supports.target_cap) : "Uygulanmaz";
      
      doc.text(convertTurkishChars(`Vergi Indirim Destegi Yatirim Katki Orani: ${targetTaxDiscount}`), leftMargin + 5, yPos);
      yPos += 5;
      doc.text(convertTurkishChars(`Faiz/Kar Payi Destegi Orani: ${targetInterestSupport}`), leftMargin + 5, yPos);
      yPos += 5;
      doc.text(convertTurkishChars(`Faiz/Kar Payi Destegi Ust Limit Tutari: ${targetCap}`), leftMargin + 5, yPos);
      yPos += 10;
    }
    
    // Priority Investment Supports
    if (incentiveResult.sector.isPriority) {
      doc.setFillColor(green[0], green[1], green[2]);
      doc.rect(leftMargin, yPos, contentWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(convertTurkishChars('Oncelikli Yatirim Destekleri'), leftMargin + 5, yPos + 4);
      
      yPos += 10;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const priorityTaxDiscount = incentiveResult.supports.priority_tax_discount !== "N/A" ? 
        formatPercentage(incentiveResult.supports.priority_tax_discount) : "Uygulanmaz";
      const priorityInterestSupport = incentiveResult.supports.priority_interest_support !== "N/A" ? 
        formatPercentage(incentiveResult.supports.priority_interest_support) : "Uygulanmaz";
      const priorityCap = incentiveResult.supports.priority_cap !== "N/A" ? 
        formatCurrency(incentiveResult.supports.priority_cap) : "Uygulanmaz";
      
      doc.text(convertTurkishChars(`Vergi Indirim Destegi Yatirim Katki Orani: ${priorityTaxDiscount}`), leftMargin + 5, yPos);
      yPos += 5;
      doc.text(convertTurkishChars(`Faiz/Kar Payi Destegi Orani: ${priorityInterestSupport}`), leftMargin + 5, yPos);
      yPos += 5;
      doc.text(convertTurkishChars(`Faiz/Kar Payi Destegi Ust Limit Tutari: ${priorityCap}`), leftMargin + 5, yPos);
      yPos += 10;
    }
    
    // Important Warning section
    if (((incentiveResult.sector.isTarget && incentiveResult.supports.target_cap_ratio !== "N/A") || 
         (incentiveResult.sector.isPriority && incentiveResult.supports.priority_cap_ratio !== "N/A"))) {
      
      doc.setFillColor(255, 243, 205);
      doc.rect(leftMargin, yPos, contentWidth, 15, 'F');
      
      doc.setFillColor(255, 193, 7);
      doc.rect(leftMargin, yPos, 3, 15, 'F');
      
      doc.setTextColor(133, 100, 4);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(convertTurkishChars('⚠ Onemli Uyari:'), leftMargin + 8, yPos + 6);
      
      doc.setFont('helvetica', 'normal');
      const ratioText = incentiveResult.sector.isTarget && incentiveResult.supports.target_cap_ratio !== "N/A" ? 
        formatPercentage(incentiveResult.supports.target_cap_ratio) :
        incentiveResult.sector.isPriority && incentiveResult.supports.priority_cap_ratio !== "N/A" ?
        formatPercentage(incentiveResult.supports.priority_cap_ratio) : "%10";
      
      doc.text(convertTurkishChars(`Faiz/Kar Payi Destegi toplam sabit yatirim tutarinin ${ratioText}'unu gecemez.`), leftMargin + 8, yPos + 11);
      
      yPos += 20;
    }
    
    // Special Conditions section
    if (incentiveResult.sector.conditions && yPos < 240) {
      doc.setFillColor(252, 248, 227);
      doc.rect(leftMargin, yPos, contentWidth, 8, 'F');
      
      doc.setTextColor(133, 77, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(convertTurkishChars('Ozel Sartlar ve Kosullar:'), leftMargin + 5, yPos + 5);
      
      yPos += 12;
      
      doc.setTextColor(120, 53, 15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Split long text into multiple lines and convert Turkish characters
      const conditionLines = doc.splitTextToSize(convertTurkishChars(incentiveResult.sector.conditions), contentWidth - 10);
      
      // Check if we need a new page
      if (yPos + (conditionLines.length * 4) > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(conditionLines, leftMargin + 5, yPos);
      yPos += conditionLines.length * 4 + 10;
    }
    
    // Footer
    const footerY = pageHeight - 25;
    doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.rect(0, footerY, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(convertTurkishChars('Bu rapor sistem tarafindan otomatik olarak olusturulmustur.'), leftMargin, footerY + 8);
    doc.text(convertTurkishChars(`Olusturma Tarihi: ${new Date().toLocaleString('tr-TR')}`), leftMargin, footerY + 14);
    doc.text(convertTurkishChars('Detayli bilgi icin ilgili kurumlara basvurunuz.'), leftMargin, footerY + 20);
    
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
