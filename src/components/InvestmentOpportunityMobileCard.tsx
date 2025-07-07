
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Download, Share2, MapPin, Calendar, Users, Clock, DollarSign } from 'lucide-react';
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

interface InvestmentOpportunityMobileCardProps {
  report: FeasibilityReport;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

export const InvestmentOpportunityMobileCard = ({ report, isExpanded, onToggleExpand }: InvestmentOpportunityMobileCardProps) => {
  const getSDGIcons = (skaTag: string | null) => {
    if (!skaTag) return [];
    
    const sdgMapping: { [key: string]: string } = {
      '1': 'sdg1.svg', '2': 'sdg2.svg', '3': 'sdg3.svg', '4': 'sdg4.svg', '5': 'sdg5.svg',
      '6': 'sdg6.svg', '7': 'sdg7.svg', '8': 'sdg8.svg', '9': 'sdg9.svg', '10': 'sdg10.svg',
      '11': 'sdg11.svg', '12': 'sdg12.svg', '13': 'sdg13.svg', '14': 'sdg14.svg', '15': 'sdg15.svg',
      '16': 'sdg16.svg', '17': 'sdg17.svg',
    };

    const uniqueSDGs = new Set<string>();
    skaTag.split('|').forEach(tag => {
      const trimmedTag = tag.trim();
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

  const getCurrencyBadges = () => {
    if (!report.sabit_yatirim_tutari) return [];
    
    const amount = report.sabit_yatirim_tutari;
    const badges = [
      { currency: 'USD', amount: amount, color: 'bg-green-100 text-green-800' },
      { currency: 'EUR', amount: Math.round(amount * 0.85), color: 'bg-blue-100 text-blue-800' },
      { currency: 'GBP', amount: Math.round(amount * 0.75), color: 'bg-purple-100 text-purple-800' },
      { currency: 'TL', amount: Math.round(amount * 30), color: 'bg-orange-100 text-orange-800' }
    ];
    
    return badges;
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
  const currencyBadges = getCurrencyBadges();

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
              {report.yatirim_konusu}
            </h3>
            {report.il_tag && (
              <div className="flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3 text-gray-500" />
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
                  {report.il_tag}
                </Badge>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpand(report.id)}
            className="flex-shrink-0 h-8 px-2 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Kapat
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Detaylı Bilgi
              </>
            )}
          </Button>
        </div>
        
        {sdgIcons.length > 0 && (
          <div className="flex flex-nowrap overflow-x-auto gap-1 pb-1 scrollbar-hide">
            {sdgIcons.map((sdg, index) => (
              <img
                key={`${report.id}-sdg-${sdg.number}-${index}`}
                src={`/img/sdgicon/${sdg.icon}`}
                alt={sdg.label}
                className="w-6 h-6 rounded flex-shrink-0"
                title={sdg.label}
              />
            ))}
            {sdgIcons.length > 3 && (
              <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-xs text-gray-600 flex-shrink-0">
                +{sdgIcons.length - 3}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-3 pb-3">
          <div className="space-y-3">
            {/* Metadata Row */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              {report.fizibilitenin_hazirlanma_tarihi && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(report.fizibilitenin_hazirlanma_tarihi), 'dd.MM.yyyy', { locale: tr })}</span>
                </div>
              )}
              {report.istihdam && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{report.istihdam} kişi</span>
                </div>
              )}
              {report.geri_odeme_suresi && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{report.geri_odeme_suresi} yıl</span>
                </div>
              )}
              {report.sabit_yatirim_tutari && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{report.sabit_yatirim_tutari.toLocaleString('tr-TR')} TL</span>
                </div>
              )}
            </div>

            {/* Currency Badges */}
            {currencyBadges.length > 0 && (
              <div className="space-y-1">
                {currencyBadges.map((badge, index) => (
                  <div key={index} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1 ${badge.color}`}>
                    {badge.currency} {badge.amount.toLocaleString('tr-TR')}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1 h-8 text-xs"
              >
                <Share2 className="h-3 w-3 mr-1" />
                Paylaş
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1 h-8 text-xs"
                disabled={!report.link}
              >
                <Download className="h-3 w-3 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
