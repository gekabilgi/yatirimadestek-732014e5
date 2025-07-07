
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';

const TedarikZinciriOnTalepHata = () => {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('message') || 'Beklenmedik bir hata oluştu';

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Başvuru Gönderilemedi
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800">
                {errorMessage}
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">Olası Çözümler:</h3>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Tüm zorunlu alanları doldurduğunuzdan emin olun</li>
                <li>Vergi kimlik numaranızın 10-11 haneli olduğunu kontrol edin</li>
                <li>E-posta adresinizin doğru olduğunu kontrol edin</li>
                <li>Son 1 saat içinde başvuru yapmadığınızdan emin olun</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link to="/tedarik-zinciri-yerlilestirme-on-talep-girisi">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Geri Dön
                </Link>
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tekrar Dene
              </Button>
            </div>

            <div className="text-sm text-gray-600 border-t pt-4">
              <p>
                Sorun devam ederse: 
                <a href="mailto:sistem@yatirimadestek.gov.tr" className="text-blue-600 hover:underline ml-1">
                  sistem@yatirimadestek.gov.tr
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TedarikZinciriOnTalepHata;
