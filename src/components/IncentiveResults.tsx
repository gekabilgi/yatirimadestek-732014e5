
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, TrendingUp, MapPin, Building } from 'lucide-react';
import { IncentiveResult } from '@/types/incentive';

interface IncentiveResultsProps {
  result: IncentiveResult;
}

const IncentiveResults: React.FC<IncentiveResultsProps> = ({ result }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Teşvik Hesaplama Sonuçları
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Sector Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Sektör Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-lg">{result.sector.name}</h4>
              <p className="text-muted-foreground">NACE Kodu: {result.sector.nace_code}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.sector.isTarget && <Badge variant="secondary">Hedef Yatırım</Badge>}
              {result.sector.isPriority && <Badge variant="secondary">Öncelikli Yatırım</Badge>}
              {result.sector.isHighTech && <Badge variant="secondary">Yüksek Teknoloji</Badge>}
              {result.sector.isMidHighTech && <Badge variant="secondary">Orta-Yüksek Teknoloji</Badge>}
            </div>
          </div>
          
          {result.sector.conditions && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>Sektör Şartları:</strong> {result.sector.conditions}</p>
            </div>
          )}
          
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm">
              <strong>Minimum Yatırım Tutarı:</strong> {formatCurrency(result.sector.minInvestment)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lokasyon Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">İl</p>
              <p className="font-semibold">{result.location.province}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">İlçe</p>
              <p className="font-semibold">{result.location.district}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bölge</p>
              <p className="font-semibold">{result.location.region}. Bölge</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">OSB/EB Durumu</p>
              <Badge variant={result.location.osb_status === "İÇİ" ? "default" : "secondary"}>
                {result.location.osb_status === "İÇİ" ? "OSB/EB İçinde" : "OSB/EB Dışında"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alt Bölge</p>
              <p className="font-semibold">{result.location.subregion}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Details */}
      <Card>
        <CardHeader>
          <CardTitle>Teşvik Detayları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Supports */}
          <div>
            <h4 className="font-semibold mb-3">Genel Destekler</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {result.supports.vat_exemption ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>KDV İstisnası</span>
              </div>
              <div className="flex items-center gap-2">
                {result.supports.customs_exemption ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>Gümrük Muafiyeti</span>
              </div>
            </div>
          </div>

          {/* Priority Investment Supports */}
          {result.sector.isPriority && (
            <div>
              <h4 className="font-semibold mb-3">Öncelikli Yatırım Destekleri</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Vergi İndirimi Oranı</p>
                    <p className="font-semibold text-lg">{result.supports.priority_tax_discount}</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Faiz Desteği</p>
                    <p className="font-semibold text-lg">{result.supports.priority_interest_support}</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Destek Üst Limiti</p>
                    <p className="font-semibold text-lg">{result.supports.priority_cap}</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">SYT Oranı</p>
                    <p className="font-semibold text-lg">{result.supports.priority_cap_ratio}</p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Target Investment Supports */}
          {result.sector.isTarget && (
            <div>
              <h4 className="font-semibold mb-3">Hedef Yatırım Destekleri</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Vergi İndirimi Oranı</p>
                    <p className="font-semibold text-lg">{result.supports.target_tax_discount}</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Faiz Desteği</p>
                    <p className="font-semibold text-lg">{result.supports.target_interest_support}</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Destek Üst Limiti</p>
                    <p className="font-semibold text-lg">{result.supports.target_cap}</p>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">SYT Oranı</p>
                    <p className="font-semibold text-lg">{result.supports.target_cap_ratio}</p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* SGK Support */}
          <div>
            <h4 className="font-semibold mb-3">SGK Desteği</h4>
            <Card className="p-4 bg-secondary/20">
              <div className="flex items-center justify-between">
                <span>SGK Destek Süresi</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {result.location.sgk_duration}
                </Badge>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncentiveResults;
