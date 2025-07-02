
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Download, MessageCircle, Share2, Globe, MapPin, Building } from 'lucide-react';
import { toast } from 'sonner';
import MainNavbar from '@/components/MainNavbar';
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

const InvestmentOpportunities = () => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [allReports, setAllReports] = useState<FeasibilityReport[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['feasibility-reports', page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_feasibility_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * 15, (page + 1) * 15 - 1);

      if (error) throw error;
      return data as FeasibilityReport[];
    },
  });

  useEffect(() => {
    if (reports) {
      if (page === 0) {
        setAllReports(reports);
      } else {
        setAllReports(prev => [...prev, ...reports]);
      }
      setHasMore(reports.length === 15);
    }
  }, [reports, page]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isLoading) {
        return;
      }
      loadMore();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoading]);

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getSDGIcons = (skaTag: string | null) => {
    if (!skaTag) return [];
    
    const sdgMapping: { [key: string]: string } = {
      '1': 'sdg1.png',
      '2': 'sdg2.png',
      '3': 'sdg3.png',
      '4': 'sdg4.png',
      '5': 'sdg5.png',
      '6': 'sdg6.png',
      '7': 'sdg7.png',
      '8': 'sdg8.png',
      '9': 'sdg9.png',
      '10': 'sdg10.png',
      '11': 'sdg11.png',
      '12': 'sdg12.png',
      '13': 'sdg13.png',
      '14': 'sdg14.png',
      '15': 'sdg15.png',
      '16': 'sdg16.png',
      '17': 'sdg17.png',
    };

    return skaTag.split('|').map(tag => {
      const sdgNumber = tag.trim().split('-')[0];
      return {
        number: sdgNumber,
        icon: sdgMapping[sdgNumber] || 'sdg1.png',
        label: tag.trim()
      };
    });
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

  const handleShare = (report: FeasibilityReport) => {
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

  const handleDownload = (report: FeasibilityReport) => {
    if (report.link) {
      window.open(report.link, '_blank');
    } else {
      toast.error('İndirme linki bulunamadı');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Hata Oluştu</h1>
            <p className="text-gray-600">Yatırım fırsatları yüklenirken bir hata oluştu.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yatırım Fırsatları</h1>
          <p className="text-gray-600">Fizibilite raporları ve yatırım fırsatları</p>
        </div>

        {isLoading && page === 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allReports.map((report) => {
              const isExpanded = expandedCards.has(report.id);
              const sdgIcons = getSDGIcons(report.ska_tag);

              return (
                <Card key={report.id} className="transition-all duration-200 hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {report.yatirim_konusu}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(report.id)}
                        className="ml-2 flex-shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {sdgIcons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sdgIcons.map((sdg, index) => (
                          <img
                            key={index}
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
                            <p className="text-sm text-gray-600">{report.geri_odeme_suresi} ay</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare(report)}
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
                            onClick={() => handleDownload(report)}
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
            })}
          </div>
        )}

        {isLoading && page > 0 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-2">Daha fazla rapor yükleniyor...</p>
          </div>
        )}

        {!hasMore && allReports.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">Tüm raporlar görüntülendi</p>
          </div>
        )}

        {allReports.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz yatırım fırsatı bulunmuyor</h3>
            <p className="text-gray-600">Yeni fırsatlar eklendiğinde burada görünecektir.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentOpportunities;
