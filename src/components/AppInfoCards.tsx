
import React from 'react';
import { Search, Calculator, FileText, Users, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AppInfoCards = () => {
  const features = [
    {
      icon: Search,
      title: "Sektör Bazlı Sorgulama",
      description: "Hedef, öncelikli ve teknoloji sektörlerinde geçerli teşvikleri kolayca sorgulayın ve size uygun destekleri keşfedin.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Calculator,
      title: "Teşvik Hesaplama",
      description: "Yatırım tutarınıza göre Teknoloji Hamlesi, Yerel Kalkınma ve Stratejik Hamle kapsamında teşvik miktarlarını hesaplayın.",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: FileText,
      title: "Güncel Mevzuat",
      description: "9903 sayılı yeni teşvik sistemine uygun, güncel mevzuat ve düzenlemelere göre hesaplamalar yapın.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Users,
      title: "Kullanıcı Dostu",
      description: "Basit ve anlaşılır arayüz ile herkes kolayca teşvik sorgulama ve hesaplama işlemlerini gerçekleştirebilir.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Shield,
      title: "Güvenilir Veriler",
      description: "Resmi kaynaklardan alınan güncel veriler ile doğru ve güvenilir sonuçlar elde edin.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      icon: Zap,
      title: "Hızlı Sonuçlar",
      description: "Anında hesaplama ve sorgulama ile zaman kaybetmeden yatırım kararlarınızı optimize edin.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  const usageSteps = [
    {
      step: "1",
      title: "Modül Seçimi",
      description: "Sektör sorgusu veya teşvik hesaplama modülünden birini seçin."
    },
    {
      step: "2", 
      title: "Bilgi Girişi",
      description: "Sektör bilgilerinizi, yatırım tutarını ve bölge seçimini yapın."
    },
    {
      step: "3",
      title: "Sonuç Alma",
      description: "Sistem otomatik olarak size uygun teşvikleri ve tutarları hesaplar."
    },
    {
      step: "4",
      title: "Rapor İndirme",
      description: "Hesaplama sonuçlarını PDF formatında indirebilirsiniz."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Features Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Neden 9903 | YTS Platformunu Kullanmalısınız?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Türkiye'nin yeni yatırım teşvik sistemi hakkında kapsamlı bilgi ve hesaplama imkanları sunan platformumuzun özelliklerini keşfedin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How to Use Section */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Nasıl Kullanılır?
            </h3>
            <p className="text-gray-600">
              4 basit adımda teşvik sorgulama ve hesaplama işlemlerinizi tamamlayın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {usageSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {step.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-gray-600 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppInfoCards;
