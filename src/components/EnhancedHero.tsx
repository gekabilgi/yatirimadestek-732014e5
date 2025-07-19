import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Calculator, FileDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const EnhancedHero = () => {
  const navigate = useNavigate();
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('app_statistics')
          .select('stat_value')
          .in('stat_name', ['search_clicks', 'calculation_clicks']);

        if (error) {
          console.error('Error fetching stats:', error);
          return;
        }

        const total = data.reduce((sum, stat) => sum + stat.stat_value, 0);
        setTotalClicks(total);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleGetStarted = () => {
    navigate('/incentive-tools');
  };

  const handleMevzuatIncele = () => {
    window.open('https://sanayi.gov.tr/mevzuat/diger/mc0403018201', '_blank');
  };

  const stats = [
    { label: "Aktif Destek Çağrısı", value: "150+" },
    { label: "Desteklenen Sektör", value: "1.000+" },
    { 
      label: "Toplam Destek Arama & Hesaplama", 
      value: isLoading ? "Yükleniyor..." : `${totalClicks.toLocaleString('tr-TR')}+` 
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 py-16 sm:py-20">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
              Türkiye Yüzyılı Kalkınma Hamlesi
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Yatırımlarda Devlet
            <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              {" "}Destekleri
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
            Yeni teşvik sisteminde size uygun destekleri bulun, teşvik tutarlarını hesaplayın ve 
            yatırım kararlarınızı en doğru verilerle optimize edin.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            >
              Hemen Başlayın
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleMevzuatIncele}
              className="px-8 py-3 text-lg"
            >
              <FileDown className="mr-2 h-5 w-5" />
              Mevzuat İncele
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-md bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Feature Preview Cards */}
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
              <Card 
                className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => navigate('/incentive-tools?module=query')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-lg bg-blue-500 p-2 text-white">
                      <Search className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Sektör Sorgusu</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Sektörünüze özel teşvik imkanlarını keşfedin
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => navigate('/incentive-tools?module=calculator')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-lg bg-green-500 p-2 text-white">
                      <Calculator className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Teşvik Hesaplama</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Yatırımınıza uygun teşvik tutarlarını hesaplayın
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-lg hover:shadow-xl transition-all cursor-pointer sm:col-span-2 lg:col-span-1"
                onClick={() => navigate('/qna')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-lg bg-purple-500 p-2 text-white">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Soru-Cevap</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Uzmanlarımızdan yanıtlanmış soruları inceleyin
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHero;
