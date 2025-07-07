import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Download, MessageCircle, Share2, Globe, MapPin, Building, Calendar, Users, Clock } from 'lucide-react';
import { CurrencyBadges } from './CurrencyBadges';
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

interface InvestmentOpportunityRowProps {
  report: FeasibilityReport;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

export const InvestmentOpportunityRow = ({ report, isExpanded, onToggleExpand }: InvestmentOpportunityRowProps) => {
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

    const sdgNames: { [key: string]: string } = {
      "1": "No Poverty",
      "2": "Zero Hunger",
      "3": "Good Health and Well-being",
      "4": "Quality Education",
      "5": "Gender Equality",
      "6": "Clean Water and Sanitation",
      "7": "Affordable and Clean Energy",
      "8": "Decent Work and Economic Growth",
      "9": "Industry, Innovation and Infrastructure",
      "10": "Reduced Inequalities",
      "11": "Sustainable Cities and Communities",
      "12": "Responsible Consumption and Production",
      "13": "Climate Action",
      "14": "Life Below Water",
      "15": "Life on Land",
      "16": "Peace, Justice and Strong Institutions",
      "17": "Partnerships for the Goals"
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
      label: `SDG ${sdgNumber}`,
      title: `SDG ${sdgNumber}: ${sdgNames[sdgNumber] || 'Unknown Goal'}`
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
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight mb-3">
              {report.yatirim_konusu}
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3 w-full">
              {report.il_tag && (
                <div className="flex items-center gap-1">
                  <span>Yatırım Yeri: </span>
                  <MapPin className="h-4 w-4" />
                  <span>{report.il_tag}</span>
                </div>
              )}
             
              {report.istihdam && (
                <div className="flex items-center gap-1">
                  <span>Öngörülen İstihdam: </span>
                  <Users className="h-4 w-4" />
                  <span>{report.istihdam} kişi |</span>
                </div>
              )}
              
              {report.geri_odeme_suresi && (
                <div className="flex items-center gap-1">
                  <span>Yatırımın Geri Dönüş Süresi: </span>
                  <Clock className="h-4 w-4" />
                  <span>{report.geri_odeme_suresi} yıl |</span>
                </div>
              )}
               
              {report.fizibilitenin_hazirlanma_tarihi && (
                <div className="flex items-center gap-1">
                  <span>Rapor Tarihi: </span>
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(report.fizibilitenin_hazirlanma_tarihi), 'dd.MM.yyyy', { locale: tr })}</span>
                </div>
              )}
              
            </div>

            {/* Currency badges for investment amount */}
            {report.sabit_yatirim_tutari && (
              <div className="mb-2">
                <CurrencyBadges usdAmount={report.sabit_yatirim_tutari} />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {sdgIcons.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sdgIcons.slice(0, 3).map((sdg, index) => (
                  <img
                    key={`${report.id}-sdg-${sdg.number}-${index}`}
                    src={`/img/sdgicon/${sdg.icon}`}
                    alt={sdg.title}
                    className="w-8 h-8 rounded"
                    title={sdg.title}
                  />
                ))}
                {sdgIcons.length > 3 && (
                  <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs font-medium">
                    +{sdgIcons.length - 3}
                  </div>
                )}
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleExpand(report.id)}
              className="text-gray-600 hover:text-gray-900"
            >
              DETAYLI BİLGİ
              {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
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

              {report.ust_sektor_tanim_tag && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Üst Sektör:</span>
                  <p className="text-sm text-gray-600">{report.ust_sektor_tanim_tag}</p>
                </div>
              )}

              {report.alt_sektor_tanim_tag && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Alt Sektör:</span>
                  <p className="text-sm text-gray-600">{report.alt_sektor_tanim_tag}</p>
                </div>
              )}

              {report.nace_kodu_tanim && (
                <div>
                  <span className="text-sm font-medium text-gray-700">NACE Kodu:</span>
                  <p className="text-sm text-gray-600">{report.nace_kodu_tanim}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {report.kalkinma_ajansi_tag && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Kalkınma Ajansı:</span>
                  <p className="text-sm text-gray-600">{report.kalkinma_ajansi_tag}</p>
                </div>
              )}

              {report.hedef_ulke_tag && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Hedef Ülke:</span>
                  <p className="text-sm text-gray-600">{report.hedef_ulke_tag}</p>
                </div>
              )}

              {report.keywords_tag && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Anahtar Kelimeler:</span>
                  <p className="text-sm text-gray-600">{report.keywords_tag}</p>
                </div>
              )}

              {sdgIcons.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">Sürdürülebilir Kalkınma Hedefleri:</span>
                  <div className="flex flex-wrap gap-1">
                    {sdgIcons.map((sdg, index) => (
                      <img
                        key={`${report.id}-sdg-expanded-${sdg.number}-${index}`}
                        src={`/img/sdgicon/${sdg.icon}`}
                        alt={sdg.title}
                        className="w-8 h-8 rounded"
                        title={sdg.title}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4 mt-4 border-t">
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
        </CardContent>
      )}
    </Card>
  );
};
