import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import MainNavbar from '@/components/MainNavbar';

const TZYOTGBasarili = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's session data indicating a successful submission
    const submissionData = sessionStorage.getItem('tzy_submission_success');
    if (!submissionData) {
      // If no submission data, redirect to the form
      navigate('/tzyotg');
    }
  }, [navigate]);

  const handleBackClick = () => {
    // Clear the success flag but preserve form data
    sessionStorage.removeItem('tzy_submission_success');
    navigate('/tzyotg');
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Tedarik Zinciri Yerlileştirme
              </CardTitle>
              <p className="text-lg text-gray-600 mt-2">
                Ön Talep Başarıyla Gönderildi
              </p>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Talebiniz Başarıyla Alındı!
                </h3>
                <p className="text-green-700">
                  Tedarik zinciri yerlileştirme ön talebiniz sistemimize başarıyla kaydedilmiştir. 
                  Talebiniz değerlendirilerek en kısa sürede sizinle iletişime geçilecektir.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-md font-semibold text-blue-800 mb-2">
                  Sonraki Adımlar
                </h4>
                <ul className="text-blue-700 text-left space-y-2">
                  <li>• E-posta adresinize onay mesajı gönderilmiştir</li>
                  <li>• Talebiniz uzman ekibimiz tarafından değerlendirilecektir</li>
                  <li>• En uygun tedarikçiler belirlenecek ve sizinle paylaşılacaktır</li>
                  <li>• Süreç hakkında bilgilendirme e-postaları alacaksınız</li>
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleBackClick}
                  variant="outline"
                  size="lg"
                  className="inline-flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Geri Dön
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TZYOTGBasarili;