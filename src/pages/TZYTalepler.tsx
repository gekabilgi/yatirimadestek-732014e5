import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Calendar, Building2, Package, Users, Award, FileText } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Product {
  id: string;
  urun_grubu_adi: string;
  urun_aciklamasi: string;
  basvuru_son_tarihi: string;
  minimum_yerlilik_orani: number;
  minimum_deneyim: number;
  firma_olcegi: string;
  pre_request_id: string;
}

interface PreRequest {
  id: string;
  firma_adi: string;
  firma_kisa_adi: string;
  logo_url: string;
  on_request_id: string;
}

interface ProductWithCompany extends Product {
  pre_request?: PreRequest;
}

const TZYTalepler = () => {
  const { on_request_id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [companyInfo, setCompanyInfo] = useState<PreRequest | null>(null);

  useEffect(() => {
    if (on_request_id) {
      fetchProductRequests();
    }
  }, [on_request_id]);

  const fetchProductRequests = async () => {
    try {
      setLoading(true);

      // First, get the company info by on_request_id
      const { data: preRequestData, error: preRequestError } = await supabase
        .from('pre_requests')
        .select('*')
        .eq('on_request_id', on_request_id)
        .eq('status', 'approved')
        .single();

      if (preRequestError) {
        console.error('Error fetching company info:', preRequestError);
        toast({
          title: "Hata",
          description: "Firma bilgileri alınırken bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }

      setCompanyInfo(preRequestData);

      // Get products for this company
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('pre_request_id', preRequestData.id)
        .eq('status', 'active')
        .gte('basvuru_son_tarihi', new Date().toISOString())
        .order('basvuru_son_tarihi', { ascending: true });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        toast({
          title: "Hata",
          description: "Ürün talepleri alınırken bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }

      const productsWithCompany = productsData.map(product => ({
        ...product,
        pre_request: preRequestData
      }));

      setProducts(productsWithCompany);
    } catch (error) {
      console.error('Error in fetchProductRequests:', error);
      toast({
        title: "Hata",
        description: "Veriler alınırken beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCardExpansion = (productId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedCards(newExpanded);
  };

  const handleApply = (productId: string) => {
    // Navigate to future application page
    navigate(`/tzy/basvuru/${productId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (dateString: string) => {
    const deadline = new Date(dateString);
    const today = new Date();
    const timeDiff = deadline.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-lg">Yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Firma Bulunamadı</h1>
            <p className="text-muted-foreground mb-6">
              Belirtilen ID ile onaylanmış bir firma kaydı bulunamadı.
            </p>
            <Button onClick={() => navigate('/tzy')} variant="outline">
              Geri Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Company Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {companyInfo.logo_url && (
              <img 
                src={companyInfo.logo_url} 
                alt={`${companyInfo.firma_adi} Logo`}
                className="w-16 h-16 object-contain bg-white rounded border"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {companyInfo.firma_adi}
              </h1>
              <p className="text-muted-foreground">
                Açık Ürün Talepleri
              </p>
            </div>
          </div>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Açık Talep Bulunamadı
            </h2>
            <p className="text-muted-foreground mb-6">
              Bu firma için henüz açık ürün talebi bulunmuyor veya tüm talepler süresi dolmuş.
            </p>
            <Button onClick={() => navigate('/tzy')} variant="outline">
              Geri Dön
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {products.map((product) => {
              const isExpanded = expandedCards.has(product.id);
              const daysUntilDeadline = getDaysUntilDeadline(product.basvuru_son_tarihi);
              
              return (
                <Card key={product.id} className="border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground mb-2">
                          {product.urun_grubu_adi}
                        </CardTitle>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Talep ID:</span>
                            <span className="font-medium">{product.id.slice(0, 8)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Son Başvuru:</span>
                            <span className="font-medium">{formatDate(product.basvuru_son_tarihi)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {daysUntilDeadline <= 3 ? (
                              <Badge variant="destructive" className="text-xs">
                                {daysUntilDeadline} gün kaldı
                              </Badge>
                            ) : daysUntilDeadline <= 7 ? (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                {daysUntilDeadline} gün kaldı
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {daysUntilDeadline} gün kaldı
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => toggleCardExpansion(product.id)}
                            className="ml-4"
                          >
                            İNCELE
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 ml-2" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-2" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="mt-4">
                          <CardContent className="pt-4 border-t border-border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">İstenilen Yerlilik Oranı:</span>
                                  <Badge variant="outline">%{product.minimum_yerlilik_orani}</Badge>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Tedarikçi Deneyim Süresi:</span>
                                  <Badge variant="outline">{product.minimum_deneyim} yıl</Badge>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Minimum Tedarikçi Ölçeği:</span>
                                  <Badge variant="outline">{product.firma_olcegi}</Badge>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-foreground mb-2">Ürün Açıklaması:</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {product.urun_aciklamasi}
                                  </p>
                                </div>
                                
                                <Button 
                                  variant="destructive" 
                                  size="lg"
                                  onClick={() => handleApply(product.id)}
                                  className="w-full"
                                >
                                  BAŞVUR
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TZYTalepler;