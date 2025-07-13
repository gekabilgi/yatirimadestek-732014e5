import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Building, User, FileText, Plus } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';
import { supabase } from '@/integrations/supabase/client';

interface PreRequest {
  id: string;
  firma_adi: string;
  iletisim_kisisi: string;
  e_posta: string;
  telefon: string;
  unvan: string;
  vergi_kimlik_no: string;
  talep_icerigi: string;
  status: string;
  created_at: string;
  on_request_id: string;
}

const TZYKayitliTalepler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const taxId = searchParams.get('taxId');
    const code = searchParams.get('code');
    
    console.log('TZY Kayıtlı Talepler - taxId:', taxId, 'code:', code);
    
    if (!taxId || !code) {
      console.log('Missing taxId or code, redirecting to /tzyotg');
      navigate('/tzyotg');
      return;
    }
    
    fetchRequests(taxId);
  }, [searchParams, navigate]);

  const fetchRequests = async (taxId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pre_requests')
        .select('*')
        .eq('vergi_kimlik_no', taxId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Reddedildi</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Beklemede</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>Talepler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600">Hata: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/tzyotg')}
            variant="outline"
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Kayıtlı Talepleriniz
              </h1>
              <p className="text-gray-600 mt-2">
                Vergi Kimlik No: {searchParams.get('taxId')} ile yapılmış talepler
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/tzyotg')}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Talep Oluştur
            </Button>
          </div>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Henüz Talep Bulunamadı
              </h3>
              <p className="text-gray-600 mb-6">
                Bu vergi kimlik numarası ile henüz herhangi bir talep gönderilmemiş.
              </p>
              <Button onClick={() => navigate('/tzyotg')}>
                İlk Talebinizi Oluşturun
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-gray-900">
                        {request.on_request_id || 'Talep ID Yok'}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(request.created_at)}
                        </div>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {request.firma_adi}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {request.iletisim_kisisi}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Firma Bilgileri</h4>
                      <p className="text-sm text-gray-600">Ünvan: {request.unvan}</p>
                      <p className="text-sm text-gray-600">VKN: {request.vergi_kimlik_no}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">İletişim</h4>
                      <p className="text-sm text-gray-600">E-posta: {request.e_posta}</p>
                      <p className="text-sm text-gray-600">Telefon: {request.telefon}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Talep İçeriği</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      {request.talep_icerigi}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TZYKayitliTalepler;