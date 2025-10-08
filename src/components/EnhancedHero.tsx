import React, { useEffect } from 'react';
import { ArrowRight, FileDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { RealtimeStatsCard } from '@/components/RealtimeStatsCard';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import AnnouncementCarousel from '@/components/AnnouncementCarousel';
import AgencyLogosSection from '@/components/AgencyLogosSection';

const EnhancedHero = () => {
  const navigate = useNavigate();
  const { trackPageView, trackSearch } = useActivityTracking();

  useEffect(() => {
    // Track homepage visit
    trackPageView('/');
  }, [trackPageView]);

  const handleGetStarted = () => {
    navigate('/start');
  };

  const handleMevzuatIncele = () => {
    navigate('/mevzuat');
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
            <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-primary border border-white/20 shadow-sm">
              <TrendingUp className="mr-3 h-4 w-4" />
              <span className="mr-3 h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
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
              onClick={handleMevzuatIncele}
              size="lg" 
              variant="outline" 
              className="btn-outline h-14 px-8 text-lg font-semibold hover:bg-primary/5 border-2"
            >
              <FileDown className="mr-2 h-5 w-5" />
              Mevzuat İncele
            </Button>
          </div>

          {/* Live Stats Grid */}
          <div className="mb-8 animate-slide-up-delay-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
              <RealtimeStatsCard 
                label="Bugünkü Hesaplama"
                statName="calculation_clicks"
                className="hover:scale-105 transition-transform duration-200"
                showTotalBadge={true}
              />
              <RealtimeStatsCard 
                label="Bugünkü Arama"
                statName="search_clicks"
                className="hover:scale-105 transition-transform duration-200"
                showTotalBadge={true}
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

          {/* Announcement Carousel */}
          <div className="animate-slide-up-delay-5">
            <AnnouncementCarousel />
          </div>

          {/* Agency Logos Section */}
          <div className="mt-8 animate-slide-up-delay-6">
            <AgencyLogosSection />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHero;
