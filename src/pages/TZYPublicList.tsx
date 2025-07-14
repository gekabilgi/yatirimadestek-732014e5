import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CompanyRequest {
  on_request_id: string;
  firma_kisa_adi: string | null;
  logo_url: string | null;
  active_request_count: number;
  earliest_deadline: string;
}

export default function TZYPublicList() {
  const [companies, setCompanies] = useState<CompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompaniesWithActiveRequests();
  }, []);

  const fetchCompaniesWithActiveRequests = async () => {
    try {
      setLoading(true);
      
      // Get companies with approved pre-requests that have active products
      const { data, error } = await supabase
        .from('pre_requests')
        .select(`
          on_request_id,
          firma_kisa_adi,
          logo_url,
          products!inner(
            basvuru_son_tarihi,
            status
          )
        `)
        .eq('status', 'approved')
        .eq('products.status', 'active')
        .gte('products.basvuru_son_tarihi', new Date().toISOString());

      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }

      // Process the data to get company info with active request counts
      const companyMap = new Map<string, CompanyRequest>();
      
      data?.forEach((item) => {
        const onRequestId = item.on_request_id;
        if (!onRequestId) return;

        if (!companyMap.has(onRequestId)) {
          companyMap.set(onRequestId, {
            on_request_id: onRequestId,
            firma_kisa_adi: item.firma_kisa_adi,
            logo_url: item.logo_url,
            active_request_count: 0,
            earliest_deadline: new Date(item.products[0]?.basvuru_son_tarihi || new Date()).toISOString()
          });
        }

        const company = companyMap.get(onRequestId)!;
        company.active_request_count += 1;
        
        // Update earliest deadline if this one is earlier
        const currentDeadline = new Date(item.products[0]?.basvuru_son_tarihi || new Date());
        const earliestDeadline = new Date(company.earliest_deadline);
        if (currentDeadline < earliestDeadline) {
          company.earliest_deadline = currentDeadline.toISOString();
        }
      });

      // Convert to array and sort by earliest deadline
      const companiesArray = Array.from(companyMap.values())
        .sort((a, b) => new Date(a.earliest_deadline).getTime() - new Date(b.earliest_deadline).getTime());

      setCompanies(companiesArray);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCompany = (onRequestId: string) => {
    navigate(`/tzy/talepler/${onRequestId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            TEDARİK ZİNCİRİ YERLİLEŞTİRME
          </h1>
          <h2 className="text-xl text-muted-foreground">
            AÇIK ÜRÜN TALEPLERİ LİSTESİ
          </h2>
        </div>

        {/* Companies Grid */}
        {companies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Şu anda aktif ürün talebi bulunmamaktadır.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map((company) => (
              <Card key={company.on_request_id} className="firm-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  {/* Company Short Name */}
                  <div className="firm-name w-full">
                    <h3 className="font-semibold text-lg leading-tight break-words max-w-full">
                      {company.firma_kisa_adi || 'Firma Adı Belirtilmemiş'}
                    </h3>
                  </div>

                  {/* Company Logo */}
                  <div className="firm-logo w-24 h-24 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={`${company.firma_kisa_adi} Logo`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm text-center">
                        Logo<br />Yok
                      </div>
                    )}
                  </div>

                  {/* Static Label */}
                  <div className="product-label">
                    <p className="text-sm font-medium text-muted-foreground">
                      TALEP EDİLEN ÜRÜNLER/İŞLER
                    </p>
                  </div>

                  {/* Active Request Count */}
                  <div className="request-count">
                    <p className="text-sm">
                      <span className="text-muted-foreground">AÇIK TALEP SAYISI: </span>
                      <span className="font-bold text-primary">{company.active_request_count}</span>
                    </p>
                  </div>

                  {/* View Button */}
                  <Button 
                    onClick={() => handleViewCompany(company.on_request_id)}
                    className="view-btn w-full"
                    variant="default"
                  >
                    İNCELE
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}