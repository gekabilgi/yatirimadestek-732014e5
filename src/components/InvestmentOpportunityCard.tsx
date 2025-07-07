
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Download, MessageCircle, Share2, Globe, MapPin, Building } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface FeasibilityReport {
  id: string;
  yatirim_konusu: string;
  fizibilitenin_hazirlanma_tarihi: string | null;
  guncellenme_tarihi: string | null;
  nace_kodu_tanim: string | null;
  gtip_kodu_tag: string | null;
  hedef_ulke_tag: string | null;
  ust_sektor_tanim_tag: string | null;
  alt_sektor_tanim_tag: string | null;
  sabit_yatirim_tutari_aralik_tag: string | null;
  kalkinma_ajansi_tag: string | null;
  il_tag: string | null;
  ska_tag: string | null;
  yatirim_boyutu_tag: string | null;
  keywords_tag: string | null;
  sabit_yatirim_tutari: number | null;
  istihdam: number | null;
  geri_odeme_suresi: number | null;
  dokumanlar: string | null;
  link: string | null;
  created_at: string;
  updated_at: string;
}

interface InvestmentOpportunityCardProps {
  report: FeasibilityReport;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

export const InvestmentOpportunityCard = ({ report, isExpanded, onToggleExpand }: InvestmentOpportunityCardProps) => {
  const getSDGIcons = (skaTag: string | null) => {
    if (!skaTag) return [];
    
    const sdgMapping: { [key: string]: string } = {
      '1': 'sdg1.svg',
      '2': 'sdg2.svg',
      '3': 'sdg3.svg',
      '4': 'sdg4.svg',
      '5': 'sdg5.svg',
      '6': 'sdg6.svg',
      '7': 'sdg7.svg',
      '8': 'sdg8.svg',
      '9': 'sdg9.svg',
      '10': 'sdg10.svg',
      '11': 'sdg11.svg',
      '12': 'sdg12.svg',
      '13': 'sdg13.svg',
      '14': 'sdg14.svg',
      '15': 'sdg15.svg',
      '16': 'sdg16.svg',
      '17': 'sdg17.svg',
    };

    // Split by | and extract unique SDG numbers
    const uniqueSDGs = new Set<string>();
    
    skaTag.split('|').forEach(tag => {
      const trimmedTag = tag.trim();
      // Extract the first number from the tag (e.g., "1-No Poverty" -> "1")
      const match = trimmedTag.match(/^(\d+)/);
      if (match) {
        uniqueSDGs.add(match[1]);
      }
    });

    return Array.from(uniqueSDGs).map(sdgNumber => ({
      number: sdgNumber,
      icon: sdgMapping[sdgNumber] || 'sdg1.svg',
      label: `SDG ${sdgNumber}`
    }));
  };

  const getScopeIcon = (scope: string | null) => {
    if (!scope) return <Globe className="h-4 w-4" />;
    
    const lowerScope = scope.toLowerCase();
    if (lowerScope.includes('yerel') || lowerScope.includes('local')) {
      return <MapPin className="h-4 w-4" />;
    } else if (lowerScope.includes('ulusal') || lowerScope.includes('national')) {
      return <Building className="h-4 w-4" />;
    }
    return <Globe className="h-4 w-4" />;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: report.yatirim_konusu,
        text: `Yatırım Fırsatı: ${report.yatirim_konusu}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link panoya kopyalandı!');
    }
  };

  const handleDownload = () => {
    if (report.link) {
      window.open(report.link, '_blank');
    } else {
      toast.error('İndirme linki bulunamadı');
    }
  };

  const sdgIcons = getSDGIcons(report.ska_tag);

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {report.yatirim_konusu}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpand(report.id)}
            className="ml-2 flex-shrink-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {sdgIcons.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {sdgIcons.map((sdg, index) => (
              <img
                key={`${report.id}-sdg-${sdg.number}-${index}`}
                src={`/img/sdgicon/${sdg.icon}`}
                alt={sdg.label}
                className="w-8 h-8 rounded"
                title={sdg.label}
              />
            ))}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {report.fizibilitenin_hazirlanma_tarihi && (
              <div>
                <span className="text-sm font-medium text-gray-700">Hazırlanma Tarihi:</span>
                <p className="text-sm text-gray-600">
                  {format(new Date(report.fizibilitenin_hazirlanma_tarihi), 'dd MMMM yyyy', { locale: tr })}
                </p>
              </div>
            )}

            {report.yatirim_boyutu_tag && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Kapsam:</span>
                <div className="flex items-center gap-1">
                  {getScopeIcon(report.yatirim_boyutu_tag)}
                  <Badge variant="outline" className="text-xs">
                    {report.yatirim_boyutu_tag}
                  </Badge>
                </div>
              </div>
            )}

            {report.il_tag && (
              <div>
                <span className="text-sm font-medium text-gray-700">İl:</span>
                <p className="text-sm text-gray-600">{report.il_tag}</p>
              </div>
            )}

            {report.sabit_yatirim_tutari && (
              <div>
                <span className="text-sm font-medium text-gray-700">Sabit Yatırım Tutarı:</span>
                <p className="text-sm text-gray-600">
                  {report.sabit_yatirim_tutari.toLocaleString('tr-TR')} TL
                </p>
              </div>
            )}

            {report.istihdam && (
              <div>
                <span className="text-sm font-medium text-gray-700">İstihdam:</span>
                <p className="text-sm text-gray-600">{report.istihdam} kişi</p>
              </div>
            )}

            {report.geri_odeme_suresi && (
              <div>
                <span className="text-sm font-medium text-gray-700">Geri Ödeme Süresi:</span>
                <p className="text-sm text-gray-600">{report.geri_odeme_suresi} yıl</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Paylaş
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Yorum özelliği yakında eklenecek')}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Yorum
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1"
                disabled={!report.link}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
