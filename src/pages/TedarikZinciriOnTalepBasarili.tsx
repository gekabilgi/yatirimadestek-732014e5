
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, FileText } from 'lucide-react';
import MainNavbar from '@/components/MainNavbar';

const TedarikZinciriOnTalepBasarili = () => {
  const [searchParams] = useSearchParams();
  const talepId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Başvurunuz Başarıyla Alındı
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800">
                Tedarik Zinciri Yerlileştirme ön talebiniz başarıyla kaydedilmiştir.
              </p>
              {talepId && (
                <p className="text-green-700 font-semibold mt-2">
                  Talep Numaranız: #{talepId}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold text-blue-800 mb-2">Sonraki Adımlar:</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Talebiniz değerlendirilecek ve sizinle iletişime geçilecektir</li>
                <li>E-posta adresinize onay mesajı gönderilecektir</li>
                <li>Kayıtlı taleplerinizi takip edebilirsiniz</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Ana Sayfa
                </Link>
              </Button>
              
              <Button asChild>
                <Link to="/tedarik-zinciri-yerlilestirme-ilanlistesi">
                  <FileText className="h-4 w-4 mr-2" />
                  İlan Listesi
                </Link>
              </Button>
            </div>

            <div className="text-sm text-gray-600 border-t pt-4">
              <p>
                Sorularınız için: 
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

export default TedarikZinciriOnTalepBasarili;
