import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';
import { InvestmentOpportunityRow } from '@/components/InvestmentOpportunityRow';
import { InvestmentOpportunityMobileCard } from '@/components/InvestmentOpportunityMobileCard';
import { InvestmentFilters, SmartFilters } from '@/components/InvestmentFilters';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [smartFilters, setSmartFilters] = useState<SmartFilters>({});
  const isMobile = useIsMobile();

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['feasibility-reports', page, keyword, smartFilters],
    queryFn: async () => {
      let query = supabase
        .from('investment_feasibility_reports')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply keyword search
      if (keyword) {
        query = query.or(`yatirim_konusu.ilike.%${keyword}%,keywords_tag.ilike.%${keyword}%,nace_kodu_tanim.ilike.%${keyword}%`);
      }

      // Apply smart filters
      if (smartFilters.naceKodlari && smartFilters.naceKodlari.length > 0) {
        const naceConditions = smartFilters.naceKodlari.map(code => `nace_kodu_tanim.ilike.%${code}%`).join(',');
        query = query.or(naceConditions);
      }

      if (smartFilters.hedefUlkeler && smartFilters.hedefUlkeler.length > 0) {
        const ulkeConditions = smartFilters.hedefUlkeler.map(ulke => `hedef_ulke_tag.ilike.%${ulke}%`).join(',');
        query = query.or(ulkeConditions);
      }

      if (smartFilters.ustSektorler && smartFilters.ustSektorler.length > 0) {
        const sektorConditions = smartFilters.ustSektorler.map(sektor => `ust_sektor_tanim_tag.ilike.%${sektor}%`).join(',');
        query = query.or(sektorConditions);
      }

      if (smartFilters.altSektorler && smartFilters.altSektorler.length > 0) {
        const altSektorConditions = smartFilters.altSektorler.map(sektor => `alt_sektor_tanim_tag.ilike.%${sektor}%`).join(',');
        query = query.or(altSektorConditions);
      }

      if (smartFilters.yatirimTutariAraligi) {
        const range = smartFilters.yatirimTutariAraligi;
        if (range === '0-1000000') {
          query = query.lte('sabit_yatirim_tutari', 1000000);
        } else if (range === '1000000-10000000') {
          query = query.gte('sabit_yatirim_tutari', 1000000).lte('sabit_yatirim_tutari', 10000000);
        } else if (range === '10000000-50000000') {
          query = query.gte('sabit_yatirim_tutari', 10000000).lte('sabit_yatirim_tutari', 50000000);
        } else if (range === '50000000-100000000') {
          query = query.gte('sabit_yatirim_tutari', 50000000).lte('sabit_yatirim_tutari', 100000000);
        } else if (range === '100000000+') {
          query = query.gte('sabit_yatirim_tutari', 100000000);
        }
      }

      if (smartFilters.kalkinmaAjanslari && smartFilters.kalkinmaAjanslari.length > 0) {
        const ajansConditions = smartFilters.kalkinmaAjanslari.map(ajans => `kalkinma_ajansi_tag.ilike.%${ajans}%`).join(',');
        query = query.or(ajansConditions);
      }

      if (smartFilters.iller && smartFilters.iller.length > 0) {
        const ilConditions = smartFilters.iller.map(il => `il_tag.ilike.%${il}%`).join(',');
        query = query.or(ilConditions);
      }

      if (smartFilters.skalar && smartFilters.skalar.length > 0) {
        const skaConditions = smartFilters.skalar.map(ska => `ska_tag.ilike.%${ska}%`).join(',');
        query = query.or(skaConditions);
      }

      const { data, error } = await query.range(page * 15, (page + 1) * 15 - 1);

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
      setIsLoadingMore(false);
    }
  }, [reports, page]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoading, isLoadingMore]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 1000 &&
        !isLoading &&
        !isLoadingMore &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoading, isLoadingMore, hasMore]);

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

  const handleSearch = () => {
    setPage(0);
    setAllReports([]);
    setExpandedCards(new Set());
    setHasMore(true);
  };

  const handleFiltersChange = (newFilters: SmartFilters) => {
    setSmartFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setPage(0);
    setAllReports([]);
    setExpandedCards(new Set());
    setHasMore(true);
    setShowFilters(false);
  };

  const getActiveFiltersCount = () => {
    return Object.values(smartFilters).filter(value => 
      Array.isArray(value) ? value.length > 0 : value
    ).length;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
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
      
      <div className={`mx-auto px-2 sm:px-4 py-4 sm:py-8 ${isMobile ? 'max-w-full' : 'max-w-6xl'}`}>
        <div className="mb-4 sm:mb-8">
          <h1 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
            Yatırım Fırsatları
          </h1>
          <p className={`text-gray-600 mb-2 sm:mb-4 ${isMobile ? 'text-sm' : ''}`}>
            Fizibilite raporları ve yatırım fırsatları
          </p>
          <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Toplam {allReports.length} sonuç bulundu
          </p>
        </div>

        <Card className={`mb-4 sm:mb-6 bg-white shadow-sm ${isMobile ? 'mx-0' : ''}`}>
          <CardHeader className={`${isMobile ? 'pb-2 px-3 pt-3' : 'pb-4'}`}>
            <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-4 w-full lg:w-auto">
                <div className="relative flex-1 min-w-0">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <Input
                    placeholder="Yatırım konusu, sektör veya anahtar kelime ara..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className={`bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      isMobile ? 'pl-9 h-10 text-sm' : 'pl-10 h-12'
                    }`}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(true)}
                    className={`bg-white border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap relative ${
                      isMobile ? 'h-10 px-3 text-sm' : 'h-12 px-4 sm:px-6'
                    }`}
                  >
                    <Filter className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    Akıllı Filtreler
                    {getActiveFiltersCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {getActiveFiltersCount()}
                      </span>
                    )}
                  </Button>
                  <Button
                    onClick={handleSearch}
                    className={`${isMobile ? 'h-10 px-4 text-sm' : 'h-12 px-6'}`}
                  >
                    Ara
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {isLoading && page === 0 ? (
          <div className={`space-y-2 sm:space-y-4 ${isMobile ? 'px-0' : ''}`}>
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
          <div className={`space-y-2 sm:space-y-4 ${isMobile ? 'px-0' : ''}`}>
            {allReports.map((report) => 
              isMobile ? (
                <InvestmentOpportunityMobileCard
                  key={report.id}
                  report={report}
                  isExpanded={expandedCards.has(report.id)}
                  onToggleExpand={toggleExpand}
                />
              ) : (
                <InvestmentOpportunityRow
                  key={report.id}
                  report={report}
                  isExpanded={expandedCards.has(report.id)}
                  onToggleExpand={toggleExpand}
                />
              )
            )}
          </div>
        )}

        {isLoadingMore && (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {Object.keys(smartFilters).some(key => smartFilters[key as keyof SmartFilters]) ? 'Arama kriterlerinize uygun yatırım fırsatı bulunamadı' : 'Henüz yatırım fırsatı bulunmuyor'}
            </h3>
            <p className="text-gray-600">
              {Object.keys(smartFilters).some(key => smartFilters[key as keyof SmartFilters]) ? 'Farklı arama kriterleri deneyebilirsiniz.' : 'Yeni fırsatlar eklendiğinde burada görünecektir.'}
            </p>
          </div>
        )}
      </div>

      <InvestmentFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={smartFilters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default InvestmentOpportunities;
