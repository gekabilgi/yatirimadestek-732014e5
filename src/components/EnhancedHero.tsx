import React, { useEffect, useRef } from 'react';
import { ArrowRight, FileDown, Home, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTodayActivity } from '@/hooks/useTodayActivity';
import { useRealtimeCounters } from '@/hooks/useRealtimeCounters';
import { Badge } from '@/components/ui/badge';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import AnnouncementCarousel from '@/components/AnnouncementCarousel';
import AgencyLogosSection from '@/components/AgencyLogosSection';
import { useCanvasAnimation } from '@/hooks/useCanvasAnimation';
import MainNavbar from '@/components/MainNavbar';

const EnhancedHero = () => {
  const navigate = useNavigate();
  const { trackPageView } = useActivityTracking();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  
  // Initialize canvas animation
  useCanvasAnimation(canvasRef, heroSectionRef);
  
  // Stats hooks
  const { stats, isLoading: isLoadingStats } = useTodayActivity();
  const { globalCount: totalCalculations, isLoading: isLoadingCalcTotal } = useRealtimeCounters('calculation_clicks');
  const { globalCount: totalSearches, isLoading: isLoadingSearchTotal } = useRealtimeCounters('search_clicks');

  const formatNumber = (num: number) => num.toLocaleString('tr-TR');

  useEffect(() => {
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
    <>
      {/* Full-Screen Hero Section with Blue Gradient */}
      <section ref={heroSectionRef} className="relative overflow-hidden bg-gradient-to-br from-primary/80 via-primary to-primary/90 min-h-[65vh] flex flex-col">
        {/* Canvas Particle Animation */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ willChange: 'transform' }}
        />

        {/* Background Elements - Reduced Opacity */}
        <div className="absolute inset-0 opacity-20">
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>

        {/* Use MainNavbar component */}
        <MainNavbar className="relative z-10" />

        {/* Hero Content */}
        <div className="relative z-10 flex-1 px-4 sm:px-8 py-8 sm:py-12 flex items-center">
          <div className="mx-auto max-w-7xl w-full text-center space-y-8 px-4 sm:px-6 lg:px-8">
            {/* Platform Badge */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <Home className="h-4 w-4" />
                <span>Türkiye'nin En Kapsamlı Teşvik Platformu</span>
              </div>
            </div>

            {/* Main Heading */}
            <div className="animate-fade-in">
              <h1 className="text-balance text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
                Yatırım Teşvikleri ve{" "}
                <span className="text-blue-200">Destek Programları</span>
              </h1>
            </div>

            {/* Description */}
            <div className="animate-slide-up-delay-1">
              <p className="mx-auto max-w-3xl text-balance text-base sm:text-lg leading-relaxed text-white/90">
                İşletmeniz için en uygun teşvik ve destek programlarını keşfedin. 
                Akıllı hesaplama araçlarımız ile potansiyel faydalarınızı öğrenin ve 
                başvuru sürecinizi hızlandırın.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="animate-slide-up-delay-2 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 flex-wrap">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group bg-white/20 hover:bg-white/30 text-white border-2 border-white backdrop-blur-sm"
              >
                Hemen Başla
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button 
                onClick={handleMevzuatIncele}
                size="lg" 
                variant="outline" 
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-white/10 hover:bg-white/20 border-2 border-white text-white backdrop-blur-sm transition-all duration-300"
              >
                <FileDown className="mr-2 h-5 w-5" />
                Mevzuat İncele
              </Button>

              <Button 
                asChild
                size="lg" 
                variant="outline" 
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-white/10 hover:bg-white/20 border-2 border-white text-white backdrop-blur-sm transition-all duration-300"
              >
                <a href="https://yerelkalkinmahamlesi.sanayi.gov.tr/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Yerel Kalkınma Hamlesi
                </a>
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="animate-slide-up-delay-3 mt-12 sm:mt-16">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
                {/* Today's Calculations */}
                <div className="space-y-2">
                  <div className="text-4xl sm:text-5xl font-bold text-white">
                    {isLoadingStats ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    ) : (
                      formatNumber(stats.todayCalculations)
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-white/80">
                    Bugünkü Hesaplama
                  </div>
                  <Badge className="bg-transparent border-0 text-xs text-blue-200 hover:bg-transparent">
                    {isLoadingCalcTotal ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `Toplam: ${formatNumber(totalCalculations)}`
                    )}
                  </Badge>
                </div>

                {/* Today's Searches */}
                <div className="space-y-2">
                  <div className="text-4xl sm:text-5xl font-bold text-white">
                    {isLoadingStats ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    ) : (
                      formatNumber(stats.todaySearches)
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-white/80">
                    Bugünkü Arama
                  </div>
                  <Badge className="bg-transparent border-0 text-xs text-blue-200 hover:bg-transparent">
                    {isLoadingSearchTotal ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `Toplam: ${formatNumber(totalSearches)}`
                    )}
                  </Badge>
                </div>

                {/* Static Stats */}
                {staticStats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="text-4xl sm:text-5xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-white/80">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcement Carousel Section - White Background */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnnouncementCarousel />
        </div>
      </section>

      {/* Agency Logos Section */}
      <AgencyLogosSection />
    </>
  );
};

export default EnhancedHero;