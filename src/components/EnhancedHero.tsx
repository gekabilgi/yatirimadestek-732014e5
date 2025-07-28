import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Calculator, FileDown, MessageSquare, Building2, TrendingUp } from 'lucide-react';
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
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-20 sm:py-28">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-6xl text-center">
          {/* Badge */}
          <div className="mb-8 animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary/10 to-blue-600/10 px-6 py-3 text-sm font-semibold text-primary border border-primary/20 shadow-sm">
              <span className="mr-3 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Türkiye Yüzyılı Kalkınma Hamlesi
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl xl:text-8xl animate-fade-in">
            Yatırımlarda Devlet
            <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Destekleri
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-8 text-xl leading-8 text-gray-600 max-w-4xl mx-auto animate-fade-in font-medium">
            Yeni teşvik sisteminde size uygun destekleri bulun, teşvik tutarlarını hesaplayın ve 
            yatırım kararlarınızı en doğru verilerle optimize edin.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
            >
              Hemen Başlayın
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleMevzuatIncele}
              className="px-8 py-4 text-lg font-semibold border-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 rounded-xl"
            >
              <FileDown className="mr-2 h-5 w-5" />
              Mevzuat İncele
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <Card key={index} className="card-elevated bg-white/80 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-3">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Feature Preview Cards */}
          <div className="mt-20 animate-fade-in">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 max-w-7xl mx-auto">
              <Card 
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-2xl xl:col-span-2"
                onClick={() => navigate('/incentive-tools?module=query')}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-xl bg-blue-500 p-3 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Search className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Sektör Sorgusu</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Sektörünüze özel teşvik imkanlarını keşfedin
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-2xl xl:col-span-2"
                onClick={() => navigate('/incentive-tools?module=calculator')}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-xl bg-green-500 p-3 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Calculator className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Teşvik Hesaplama</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Yatırımınıza uygun teşvik tutarlarını hesaplayın
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-2xl xl:col-span-2"
                onClick={() => navigate('/qna')}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-xl bg-purple-500 p-3 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Soru-Cevap</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Uzmanlarımızdan yanıtlanmış soruları inceleyin
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-2xl xl:col-span-2"
                onClick={() => navigate('/searchsupport')}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-xl bg-orange-500 p-3 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Search className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Destek Arama</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Size uygun destek programlarını bulun
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-teal-50 to-teal-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-2xl xl:col-span-2"
                onClick={() => navigate('/tzy')}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-xl bg-teal-500 p-3 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Tedarik Zinciri</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Yerli tedarikçiler ile buluşun
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-2xl xl:col-span-2"
                onClick={() => navigate('/yatirim-firsatlari')}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="rounded-xl bg-indigo-500 p-3 text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">Yatırım Fırsatları</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Fizibilite raporları ve fırsatları keşfedin
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
