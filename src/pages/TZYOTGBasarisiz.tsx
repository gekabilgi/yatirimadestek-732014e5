import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import MainNavbar from '@/components/MainNavbar';

const TZYOTGBasarisiz = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's session data indicating a failed submission
    const submissionData = sessionStorage.getItem('tzy_submission_error');
    if (!submissionData) {
      // If no submission data, redirect to the form
      navigate('/tzyotg');
    }
  }, [navigate]);

  const handleBackClick = () => {
    // Clear the error flag but preserve form data
    sessionStorage.removeItem('tzy_submission_error');
    navigate('/tzyotg');
  };

  const getErrorMessage = () => {
    const errorData = sessionStorage.getItem('tzy_submission_error');
    if (errorData) {
      try {
        const parsed = JSON.parse(errorData);
        return parsed.message || 'Bilinmeyen bir hata oluştu';
      } catch {
        return 'Bilinmeyen bir hata oluştu';
      }
    }
    return 'Bilinmeyen bir hata oluştu';
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Tedarik Zinciri Yerlileştirme
              </CardTitle>
              <p className="text-lg text-gray-600 mt-2">
                Ön Talep Gönderimi Başarısız
              </p>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Talep Gönderilemedi
                </h3>
                <p className="text-red-700">
                  Talebiniz gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Hata detayı: {getErrorMessage()}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="text-md font-semibold text-yellow-800 mb-2">
                  Ne Yapabilirsiniz?
                </h4>
                <ul className="text-yellow-700 text-left space-y-2">
                  <li>• Geri dön butonuna tıklayarak formu tekrar deneyebilirsiniz</li>
                  <li>• Tüm bilgileriniz korunmuştur, yeniden girmenize gerek yoktur</li>
                  <li>• İnternet bağlantınızı kontrol ediniz</li>
                  <li>• Sorun devam ederse teknik destek ile iletişime geçiniz</li>
                </ul>
              </div>

              <div className="pt-4 space-x-4">
                <Button
                  onClick={handleBackClick}
                  variant="default"
                  size="lg"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Geri Dön
                </Button>
                
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="lg"
                  className="inline-flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sayfayı Yenile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TZYOTGBasarisiz;