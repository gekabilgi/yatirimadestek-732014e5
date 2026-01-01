import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, CheckCircle } from 'lucide-react';
import SoruSorModal from './SoruSorModal';

const QnaSection = () => {
  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Nasıl Çalışır?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                  Yukarıdaki "Soru Sor" butonuna tıklayarak form ile sorunuzu gönderin
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                  Sorunuz ilgili uzman ekibe yönlendirilir
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                  24-48 saat içinde e-posta ile yanıt alırsınız
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Sık Sorulan Konular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Yatırım teşvik başvuru süreçleri</li>
                <li>• Sektörel destek programları</li>
                <li>• Bölgesel teşvik imkanları</li>
                <li>• Gerekli belgeler ve şartlar</li>
                <li>• Başvuru sonrası süreçler</li>
                <li>• Vergi indirimleri ve muafiyetler</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <SoruSorModal />
        </div>
      </div>
    </section>
  );
};

export default QnaSection;
