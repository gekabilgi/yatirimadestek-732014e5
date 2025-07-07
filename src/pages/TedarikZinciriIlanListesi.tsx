
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Building2, Package } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const TedarikZinciriIlanListesi = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: companyList, isLoading } = useQuery({
    queryKey: ['public-company-list', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('tedarik_zinciri_on_talep')
        .select(`
          *,
          tedarik_zinciri_urun_talep!inner(
            id,
            is_active,
            basvuru_son_tarihi
          )
        `)
        .eq('tedarik_zinciri_urun_talep.is_active', true)
        .gte('tedarik_zinciri_urun_talep.basvuru_son_tarihi', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`firma_adi.ilike.%${searchTerm}%,firma_kisa_adi.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by company and count active products
      const companyMap = new Map();
      data?.forEach((item: any) => {
        const key = item.firma_vergi_kimlik_no;
        if (!companyMap.has(key)) {
          companyMap.set(key, {
            ...item,
            activeProductCount: 0
          });
        }
        companyMap.get(key).activeProductCount++;
      });

      return Array.from(companyMap.values());
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Tedarik Zinciri Yerlileştirme İlanları
          </h1>
          <p className="text-gray-600 mb-6">
            Yerel tedarikçi arayışında olan firmaları keşfedin ve iş fırsatlarını değerlendirin.
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Firma adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : companyList && companyList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companyList.map((company: any) => (
              <Card key={company.firma_vergi_kimlik_no} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={`${company.firma_adi} Logo`}
                        className="w-16 h-16 object-contain bg-gray-50 rounded-lg border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1 truncate">
                        {company.firma_kisa_adi || company.firma_adi}
                      </CardTitle>
                      {company.firma_kisa_adi && (
                        <p className="text-sm text-gray-600 truncate">
                          {company.firma_adi}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Package className="w-4 h-4" />
                      <span className="font-medium">
                        {company.activeProductCount} Açık Talep
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {company.talep_icerigi}
                  </p>
                  
                  <Button asChild className="w-full">
                    <Link to={`/tedarik-zinciri-yerlilestirme-ttl-${company.firma_vergi_kimlik_no}`}>
                      İncele
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz ilan bulunmuyor'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Arama kriterlerinizi değiştirerek tekrar deneyin'
                : 'Yakında yeni ilanlar yayınlanacak'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TedarikZinciriIlanListesi;
