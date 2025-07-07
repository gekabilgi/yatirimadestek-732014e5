
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, Target, Award, ArrowLeft } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const TedarikZinciriFirmaDetay = () => {
  const { vkn } = useParams<{ vkn: string }>();

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['public-company-detail', vkn],
    queryFn: async () => {
      if (!vkn) throw new Error('VKN parameter missing');
      
      const { data: company, error: companyError } = await supabase
        .from('tedarik_zinciri_on_talep')
        .select('*')
        .eq('firma_vergi_kimlik_no', vkn)
        .single();

      if (companyError) throw companyError;

      const { data: products, error: productsError } = await supabase
        .from('tedarik_zinciri_urun_talep')
        .select('*')
        .eq('on_talep_id', company.id)
        .eq('is_active', true)
        .gte('basvuru_son_tarihi', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      return { company, products };
    },
    enabled: !!vkn
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRemainingDays = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Firma bulunamadı</h3>
            <p className="text-gray-600 mb-4">Aradığınız firma mevcut değil veya aktif ilanı bulunmuyor.</p>
            <Button asChild>
              <Link to="/tedarik-zinciri-yerlilestirme-ilanlistesi">
                <ArrowLeft className="w-4 h-4 mr-2" />
                İlan Listesine Dön
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { company, products } = companyData;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="outline" className="mb-4">
            <Link to="/tedarik-zinciri-yerlilestirme-ilanlistesi">
              <ArrowLeft className="w-4 h-4 mr-2" />
              İlan Listesine Dön
            </Link>
          </Button>
        </div>

        {/* Company Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start space-x-6">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={`${company.firma_adi} Logo`}
                  className="w-24 h-24 object-contain bg-gray-50 rounded-lg border"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {company.firma_kisa_adi || company.firma_adi}
                </CardTitle>
                {company.firma_kisa_adi && (
                  <p className="text-lg text-gray-600 mb-2">{company.firma_adi}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>İletişim: {company.iletisim_kisi}</span>
                  {company.unvan && <span>({company.unvan})</span>}
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {products?.length || 0} Aktif İlan
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div>
              <h3 className="font-medium mb-2">Talep Açıklaması</h3>
              <p className="text-gray-700 leading-relaxed">{company.talep_icerigi}</p>
            </div>
          </CardContent>
        </Card>

        {/* Product List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Ürün Talepleri</h2>
          
          {products && products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product: any) => {
                const remainingDays = getRemainingDays(product.basvuru_son_tarihi);
                
                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{product.urun_grubu_adi}</CardTitle>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant={remainingDays > 7 ? "default" : remainingDays > 0 ? "secondary" : "destructive"}
                          >
                            {remainingDays > 0 ? `${remainingDays} gün kaldı` : 'Süresi dolmuş'}
                          </Badge>
                          <Badge variant="outline">{product.firma_olcegi}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {product.urun_aciklamasi}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">
                            <strong>Yerlilik:</strong> %{product.minimum_yerlilik_orani}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-green-600" />
                          <span className="text-sm">
                            <strong>Deneyim:</strong> {product.minimum_deneyim} yıl
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">
                            <strong>Son Tarih:</strong> {formatDate(product.basvuru_son_tarihi)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button asChild variant="outline">
                          <Link to={`/tedarik-zinciri-yerlilestirme-ttldetay-${product.id}`}>
                            Detayları Görüntüle
                          </Link>
                        </Button>
                        <Button 
                          asChild 
                          disabled={remainingDays <= 0}
                          className={remainingDays <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          <Link to={`/tedarikci-basvuru-girisi-${product.id}`}>
                            Başvur
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Bu firma için aktif ürün talebi bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TedarikZinciriFirmaDetay;
