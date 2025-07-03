
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import MainNavbar from '@/components/MainNavbar';
import { InvestmentOpportunityCard } from '@/components/InvestmentOpportunityCard';
import { InvestmentSearchBar, InvestmentFilters } from '@/components/InvestmentSearchBar';

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
        // Handle investment range filtering
        const range = filters.investmentRange;
        if (range === '0-500.000 TL') {
          query = query.lte('sabit_yatirim_tutari', 500000);
        } else if (range === '500.000-1.000.000 TL') {
          query = query.gte('sabit_yatirim_tutari', 500000).lte('sabit_yatirim_tutari', 1000000);
        } else if (range === '1.000.000-5.000.000 TL') {
          query = query.gte('sabit_yatirim_tutari', 1000000).lte('sabit_yatirim_tutari', 5000000);
        } else if (range === '5.000.000-10.000.000 TL') {
          query = query.gte('sabit_yatirim_tutari', 5000000).lte('sabit_yatirim_tutari', 10000000);
        } else if (range === '10.000.000+ TL') {
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

  const handleSearch = (newFilters: InvestmentFilters) => {
    setFilters(newFilters);
    setPage(0);
    setAllReports([]);
    setExpandedCards(new Set());
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

        <div className="mb-6">
          <InvestmentSearchBar onSearch={handleSearch} filters={filters} />
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
            {allReports.map((report) => (
              <InvestmentOpportunityCard
                key={report.id}
                report={report}
                isExpanded={expandedCards.has(report.id)}
                onToggleExpand={toggleExpand}
              />
            ))}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {Object.keys(filters).length > 0 ? 'Arama kriterlerinize uygun yatırım fırsatı bulunamadı' : 'Henüz yatırım fırsatı bulunmuyor'}
            </h3>
            <p className="text-gray-600">
              {Object.keys(filters).length > 0 ? 'Farklı arama kriterleri deneyebilirsiniz.' : 'Yeni fırsatlar eklendiğinde burada görünecektir.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentOpportunities;
