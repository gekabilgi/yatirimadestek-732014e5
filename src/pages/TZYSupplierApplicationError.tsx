import React, { useEffect } from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';

const TZYSupplierApplicationError = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { on_request_id, product_id, error } = location.state || {};

  // Redirect to form if no context provided
  useEffect(() => {
    if (!on_request_id || !product_id) {
      navigate('/tzy');
    }
  }, [on_request_id, product_id, navigate]);

  const handleBackClick = () => {
    if (on_request_id && product_id) {
      navigate(`/tzy/talepler/basvuru/${on_request_id}/${product_id}`);
    } else {
      navigate('/tzy');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Başvuru Gönderilemedi
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Başvurunuz gönderilirken bir hata oluştu. 
            Lütfen tekrar deneyiniz veya daha sonra tekrar deneyiniz.
          </p>
          
          {error && (
            <div className="bg-red-50 p-3 rounded-lg mt-4">
              <p className="text-sm text-red-700">
                <strong>Hata detayı:</strong> {error}
              </p>
            </div>
          )}
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Kontrol Edilecek Noktalar:</h3>
            <ul className="text-sm text-gray-700 text-left space-y-1">
              <li>• İnternet bağlantınızın stabil olduğundan emin olun</li>
              <li>• Tüm zorunlu alanları doldurduğunuzdan emin olun</li>
              <li>• Dosya boyutlarının 50MB'ı geçmediğinden emin olun</li>
              <li>• Bir dakika bekleyip tekrar deneyiniz</li>
            </ul>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button 
              onClick={handleBackClick}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Forma Dön
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TZYSupplierApplicationError;