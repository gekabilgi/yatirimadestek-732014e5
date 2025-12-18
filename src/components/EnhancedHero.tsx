import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, FileDown, Home, Menu, X, User, LogOut, Settings, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { useTodayActivity } from '@/hooks/useTodayActivity';
import { useRealtimeCounters } from '@/hooks/useRealtimeCounters';
import { Badge } from '@/components/ui/badge';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import AnnouncementCarousel from '@/components/AnnouncementCarousel';
import AgencyLogosSection from '@/components/AgencyLogosSection';
import { useAuth } from '@/contexts/AuthContext';
import { shouldShowMenuItem } from '@/utils/menuVisibility';
import { useCanvasAnimation } from '@/hooks/useCanvasAnimation';
import { Logo } from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const EnhancedHero = () => {
  const navigate = useNavigate();
  const { trackPageView } = useActivityTracking();
  const { user, isAdmin, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visibleNavItems, setVisibleNavItems] = useState([
    { name: 'Destek Arama', href: '/searchsupport' },
  ]);
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

  useEffect(() => {
    const loadMenuSettings = async () => {
      try {
        const { menuVisibilityService } = await import('@/services/menuVisibilityService');
        const { MENU_ITEMS } = await import('@/types/menuSettings');
        
        // Get effective settings for current domain (domain-specific or global)
        const { settings } = await menuVisibilityService.getEffectiveMenuSettings('frontend');
        
        const visibleItems = MENU_ITEMS.filter(item => {
          const mode = (settings as any)[item.settingKey];
          return shouldShowMenuItem(mode, !!user, isAdmin);
        }).map(item => ({
          name: item.title,
          href: item.url,
        }));
        
        setVisibleNavItems(visibleItems);
      } catch (error) {
        console.error('Error loading menu settings:', error);
        setVisibleNavItems([{ name: 'Destek Arama', href: '/searchsupport' }]);
      }
    };

    loadMenuSettings();
  }, [user, isAdmin]);

  const handleGetStarted = () => {
    navigate('/start');
  };

  const handleMevzuatIncele = () => {
    navigate('/mevzuat');
  };

  const handleSignOut = async () => {
    await signOut();
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

        {/* Integrated Header */}
        <header className="relative z-10 border-b bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <Logo className="text-primary h-12 w-auto" />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="relative px-2 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:text-primary transition-all duration-200 rounded-lg hover:bg-primary/5 whitespace-nowrap group"
                  >
                    {item.name}
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-full"></span>
                  </Link>
                ))}
              </div>

              {/* Desktop Auth */}
              <div className="hidden lg:flex items-center space-x-2">
                {user && isAdmin ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-9 px-3 gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>Admin</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Paneli</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profilim</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Çıkış Yap</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-9 px-3 gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>Hesabım</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profilim</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Çıkış Yap</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin/login')}
                    className="h-9 px-3 gap-2 text-sm"
                  >
                    <User className="h-4 w-4" />
                    <span>Giriş Yap</span>
                  </Button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-primary"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="lg:hidden mt-4 pb-4 space-y-2 border-t pt-4">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg relative group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                    <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-full"></span>
                  </Link>
                ))}
                <div className="pt-2 border-t mt-2">
                  {user && isAdmin ? (
                    <>
                      <Link
                        to="/admin"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="inline-block mr-2 h-4 w-4" />
                        Admin Paneli
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="inline-block mr-2 h-4 w-4" />
                        Profilim
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-50 rounded-lg"
                      >
                        <LogOut className="inline-block mr-2 h-4 w-4" />
                        Çıkış Yap
                      </button>
                    </>
                  ) : user ? (
                    <>
                      <Link
                        to="/profile"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="inline-block mr-2 h-4 w-4" />
                        Profilim
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-50 rounded-lg"
                      >
                        <LogOut className="inline-block mr-2 h-4 w-4" />
                        Çıkış Yap
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/admin/login"
                      className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="inline-block mr-2 h-4 w-4" />
                      Giriş Yap
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 px-4 sm:px-8 py-8 sm:py-12 flex items-center">
          <div className="mx-auto max-w-5xl w-full text-center space-y-8">
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

      {/* Announcements Section - Separate White Section */}
      <section className="bg-white">
        <AnnouncementCarousel />
      </section>

      {/* Agency Logos Section - Keep As Is */}
      <AgencyLogosSection />
    </>
  );
};

export default EnhancedHero;
