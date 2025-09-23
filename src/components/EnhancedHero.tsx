import React, { useEffect } from 'react';
import { ArrowRight, Search, Calculator, FileDown, MessageSquare, Building2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { RealtimeStatsCard } from '@/components/RealtimeStatsCard';
import { useActivityTracking } from '@/hooks/useActivityTracking';

const EnhancedHero = () => {
  const navigate = useNavigate();
  const { trackPageView, trackSearch } = useActivityTracking();

  useEffect(() => {
    // Track homepage visit
    trackPageView('/');
  }, [trackPageView]);

  const handleGetStarted = () => {
    navigate('/incentive-tools');
  };

  const handleMevzuatIncele = () => {
    navigate('/mevzuat');
  };

  const handleSearchClick = () => {
    trackSearch({ action: 'search_button_click', source: 'hero' });
    navigate('/search-support');
  };

  const staticStats = [
    { label: "Aktif Destek Çağrısı", value: "150+" },
    { label: "Desteklenen Sektör", value: "1.000+" }
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-16 sm:py-22">
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
              <TrendingUp className="mr-2 h-4 w-4" />
              Türkiye'nin En Kapsamlı Teşvik Platformu
            </span>
          </div>

          {/* Main Heading */}
          <div className="mb-8 animate-slide-up-delay-1">
            <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              Yatırım Teşvikleri ve 
              <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                {" "}Destek Programları
              </span>
            </h1>
          </div>

          {/* Description */}
          <div className="mb-12 animate-slide-up-delay-2">
            <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              İşletmeniz için en uygun teşvik ve destek programlarını keşfedin. 
              Akıllı hesaplama araçlarımız ile potansiyel faydalarınızı öğrenin ve 
              başvuru sürecinizi hızlandırın.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mb-16 flex flex-col items-center justify-center gap-4 animate-slide-up-delay-3 sm:flex-row sm:gap-6">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="btn-primary h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              Hemen Başla
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <Button 
              onClick={handleSearchClick}
              size="lg" 
              variant="outline" 
              className="btn-outline h-14 px-8 text-lg font-semibold hover:bg-primary/5 border-2"
            >
              <Search className="mr-2 h-5 w-5" />
              Destek Ara
            </Button>
          </div>

          {/* Live Stats Grid */}
          <div className="mb-8 animate-slide-up-delay-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
              <RealtimeStatsCard 
                label="Bugünkü Hesaplama"
                statName="hesaplama_sayisi"
                className="hover:scale-105 transition-transform duration-200"
              />
              <RealtimeStatsCard 
                label="Bugünkü Arama"
                statName={["arama_sayisi", "destek_arama"]}
                className="hover:scale-105 transition-transform duration-200"
              />
              {staticStats.map((stat, index) => (
                <Card key={index} className="card-elevated bg-white/80 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 animate-slide-up-delay-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="card-modern hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={handleGetStarted}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-lg bg-gradient-to-br from-green-100 to-green-200 p-3 group-hover:from-green-200 group-hover:to-green-300 transition-colors duration-200">
                    <Calculator className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Teşvik Hesaplayıcı</h3>
                <p className="text-sm text-gray-600">Yatırımınız için alabileceğiniz teşvik miktarını hesaplayın</p>
              </CardContent>
            </Card>

            <Card className="card-modern hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={handleSearchClick}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 p-3 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors duration-200">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Destek Arama</h3>
                <p className="text-sm text-gray-600">Sektörünüze uygun destek programlarını keşfedin</p>
              </CardContent>
            </Card>

            <Card className="card-modern hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => navigate('/investment-opportunities')}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 p-3 group-hover:from-purple-200 group-hover:to-purple-300 transition-colors duration-200">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Yatırım Fırsatları</h3>
                <p className="text-sm text-gray-600">Bölgesel yatırım fırsatlarını inceleyin</p>
              </CardContent>
            </Card>

            <Card className="card-modern hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={handleMevzuatIncele}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 p-3 group-hover:from-orange-200 group-hover:to-orange-300 transition-colors duration-200">
                    <FileDown className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Mevzuat İncele</h3>
                <p className="text-sm text-gray-600">Güncel teşvik mevzuatını inceleyin</p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 animate-slide-up-delay-6">
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-blue-600/10 to-primary/10 p-8 border border-primary/20">
              <div className="mx-auto max-w-2xl text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  Uzman Desteği Alın
                </h2>
                <p className="mb-6 text-gray-600">
                  Teşvik başvuru sürecinizde profesyonel destek almak için uzmanlarımızla iletişime geçin.
                </p>
                <Button 
                  onClick={() => navigate('/qna')}
                  size="lg" 
                  className="btn-primary h-12 px-8 font-semibold"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Soru Sor
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHero;