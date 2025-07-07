
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { InvestmentFilters, SmartFilters } from '@/components/InvestmentFilters';

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

const AdminFeasibilityReports = () => {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [smartFilters, setSmartFilters] = useState<SmartFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['admin-feasibility-reports', page, keyword, smartFilters],
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

      const { data, error } = await query.range(page * 20, (page + 1) * 20 - 1);

      if (error) throw error;
      return data as FeasibilityReport[];
    },
  });

  const handleSearch = () => {
    setPage(0);
  };

  const handleFiltersChange = (newFilters: SmartFilters) => {
    setSmartFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setPage(0);
    setShowFilters(false);
  };

  const getActiveFiltersCount = () => {
    return Object.values(smartFilters).filter(value => 
      Array.isArray(value) ? value.length > 0 : value
    ).length;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata Oluştu</h1>
          <p className="text-gray-600">Fizibilite raporları yüklenirken bir hata oluştu.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fizibilite Raporları</h1>
            <p className="text-gray-600">Yatırım fizibilite raporlarını yönetin</p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Rapor Ekle
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Rapor ara..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className="relative"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Akıllı Filtreler
                  {getActiveFiltersCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </Button>
                <Button onClick={handleSearch}>
                  Ara
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Yatırım Konusu</th>
                      <th className="text-left py-3 px-4">İl</th>
                      <th className="text-left py-3 px-4">Sektör</th>
                      <th className="text-left py-3 px-4">Yatırım Tutarı</th>
                      <th className="text-left py-3 px-4">İstihdam</th>
                      <th className="text-left py-3 px-4">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{report.yatirim_konusu}</div>
                          {report.keywords_tag && (
                            <div className="text-sm text-gray-500 mt-1">
                              {report.keywords_tag.slice(0, 50)}...
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">{report.il_tag || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {report.ust_sektor_tanim_tag || '-'}
                          </div>
                          {report.alt_sektor_tanim_tag && (
                            <div className="text-xs text-gray-500">
                              {report.alt_sektor_tanim_tag}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {formatCurrency(report.sabit_yatirim_tutari)}
                        </td>
                        <td className="py-3 px-4">
                          {report.istihdam ? `${report.istihdam} kişi` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(report.fizibilitenin_hazirlanma_tarihi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {Object.keys(smartFilters).some(key => smartFilters[key as keyof SmartFilters]) || keyword
                    ? 'Arama kriterlerinize uygun rapor bulunamadı'
                    : 'Henüz fizibilite raporu bulunmuyor'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InvestmentFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={smartFilters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
      />
    </AdminLayout>
  );
};

export default AdminFeasibilityReports;
