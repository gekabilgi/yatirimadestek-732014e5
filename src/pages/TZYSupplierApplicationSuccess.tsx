import React from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const TZYSupplierApplicationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Başvurunuz Başarıyla Gönderildi!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Tedarikçi başvurunuz sistem tarafından alınmıştır. 
            Başvurunuz değerlendirilerek sonucu size e-posta ile bildirilecektir.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Önemli Bilgiler:</h3>
            <ul className="text-sm text-gray-700 text-left space-y-1">
              <li>• Başvurunuz ilgili firma tarafından değerlendirilecektir</li>
              <li>• Sonuç e-posta adresinize bildirilecektir</li>
              <li>• Başvuru süreciyle ilgili sorularınız için iletişim bilgilerini kullanabilirsiniz</li>
            </ul>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button 
              onClick={() => navigate('/tzy')}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ana Sayfaya Dön
            </Button>
            <Button 
              onClick={() => navigate('/tzyil')}
              className="flex-1"
            >
              Diğer Talepleri Görüntüle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TZYSupplierApplicationSuccess;