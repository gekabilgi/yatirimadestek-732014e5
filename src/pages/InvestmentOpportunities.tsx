import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, TrendingUp } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';
import StandardHero from '@/components/StandardHero';
import { InvestmentOpportunityRow } from '@/components/InvestmentOpportunityRow';
import { InvestmentOpportunityMobileCard } from '@/components/InvestmentOpportunityMobileCard';
import { InvestmentSearchBar, InvestmentFilters } from '@/components/InvestmentSearchBar';
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
  const [filters, setFilters] = useState<InvestmentFilters>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['feasibility-reports', page, filters],
    queryFn: async () => {
      let query = supabase
        .from('investment_feasibility_reports')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.keyword) {
        query = query.or(`yatirim_konusu.ilike.%${filters.keyword}%,keywords_tag.ilike.%${filters.keyword}%,nace_kodu_tanim.ilike.%${filters.keyword}%`);
      }

      if (filters.province) {
        query = query.ilike('il_tag', `%${filters.province}%`);
      }

      if (filters.sector) {
        query = query.or(`ust_sektor_tanim_tag.ilike.%${filters.sector}%,alt_sektor_tanim_tag.ilike.%${filters.sector}%,nace_kodu_tanim.ilike.%${filters.sector}%`);
      }

      if (filters.scope) {
        query = query.ilike('yatirim_boyutu_tag', `%${filters.scope}%`);
      }

      if (filters.investmentRange) {
        const range = filters.investmentRange;
        if (range === '0-500.000 USD') {
          query = query.lte('sabit_yatirim_tutari', 500000);
        } else if (range === '500.000-1.000.000 USD') {
          query = query.gte('sabit_yatirim_tutari', 500000).lte('sabit_yatirim_tutari', 1000000);
        } else if (range === '1.000.000-5.000.000 USD') {
          query = query.gte('sabit_yatirim_tutari', 1000000).lte('sabit_yatirim_tutari', 5000000);
        } else if (range === '5.000.000-10.000.000 USD') {
          query = query.gte('sabit_yatirim_tutari', 5000000).lte('sabit_yatirim_tutari', 10000000);
        } else if (range === '10.000.000+ USD') {
          query = query.gte('sabit_yatirim_tutari', 10000000);
        }
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

  const handleSearch = (newFilters: InvestmentFilters) => {
    setFilters(newFilters);
    setPage(0);
    setAllReports([]);
    setExpandedCards(new Set());
    setHasMore(true);
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
      
      <StandardHero
        title="Yatırım Fırsatları"
        description="Fizibilite raporları ve yatırım fırsatlarını keşfedin, size uygun projeleri bulun."
        badge={{
          text: "Fizibilite Raporları",
          icon: TrendingUp
        }}
        gradient="teal"
        compact
      />
      
      <div className={`mx-auto px-2 sm:px-4 py-4 sm:py-8 ${isMobile ? 'max-w-full' : 'max-w-6xl'}`}>
        <div className="mb-4 sm:mb-6">
          <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Toplam {allReports.length} sonuç bulundu
          </p>
        </div>

        <Card className={`mb-4 sm:mb-6 bg-white shadow-sm ${isMobile ? 'mx-0' : ''}`}>
          <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex-1 flex flex-col gap-3 w-full">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Yatırım konusu, sektör veya anahtar kelime ara..."
                    value={filters.keyword || ''}
                    onChange={(e) => handleSearch({ ...filters, keyword: e.target.value })}
                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 pl-10 h-11 text-base"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap h-11 px-4 text-base w-full sm:w-auto"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtreler
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid gap-3 pt-4 border-t border-gray-100 mt-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="font-medium text-gray-700 text-sm">İl</Label>
                  <Input
                    placeholder="İl seçin"
                    value={filters.province || ''}
                    onChange={(e) => handleSearch({ ...filters, province: e.target.value })}
                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-10 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className={`font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Sektör</Label>
                  <Input
                    placeholder="Sektör seçin"
                    value={filters.sector || ''}
                    onChange={(e) => handleSearch({ ...filters, sector: e.target.value })}
                    className={`bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      isMobile ? 'h-9 text-sm' : 'h-10'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Yatırım Boyutu</Label>
                  <Select
                    value={filters.scope || ''}
                    onValueChange={(value) => handleSearch({ ...filters, scope: value })}
                  >
                    <SelectTrigger className={`bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      isMobile ? 'h-9 text-sm' : 'h-10'
                    }`}>
                      <SelectValue placeholder="Boyut seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="">Tümü</SelectItem>
                      <SelectItem value="Yerel">Yerel</SelectItem>
                      <SelectItem value="Ulusal">Ulusal</SelectItem>
                      <SelectItem value="Küresel">Küresel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Yatırım Tutarı</Label>
                  <Select
                    value={filters.investmentRange || ''}
                    onValueChange={(value) => handleSearch({ ...filters, investmentRange: value })}
                  >
                    <SelectTrigger className={`bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      isMobile ? 'h-9 text-sm' : 'h-10'
                    }`}>
                      <SelectValue placeholder="Tutar aralığı" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="">Tümü</SelectItem>
                      <SelectItem value="0-500.000 USD">0-500.000 USD</SelectItem>
                      <SelectItem value="500.000-1.000.000 USD">500.000-1.000.000 USD</SelectItem>
                      <SelectItem value="1.000.000-5.000.000 USD">1.000.000-5.000.000 USD</SelectItem>
                      <SelectItem value="5.000.000-10.000.000 USD">5.000.000-10.000.000 USD</SelectItem>
                      <SelectItem value="10.000.000+ USD">10.000.000+ USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
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
              {Object.keys(filters).some(key => filters[key as keyof InvestmentFilters]) ? 'Arama kriterlerinize uygun yatırım fırsatı bulunamadı' : 'Henüz yatırım fırsatı bulunmuyor'}
            </h3>
            <p className="text-gray-600">
              {Object.keys(filters).some(key => filters[key as keyof InvestmentFilters]) ? 'Farklı arama kriterleri deneyebilirsiniz.' : 'Yeni fırsatlar eklendiğinde burada görünecektir.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentOpportunities;
