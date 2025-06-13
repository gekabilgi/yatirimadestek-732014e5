
import React from 'react';
import { Calculator, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const HeroSection = () => {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background py-16 sm:py-20">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border/10 hover:ring-border/20">
              9903 Sayılı Kararnameye uygun{' '}
              <span className="font-semibold text-primary">güncel teşvik oranları</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Yatırım Teşviklerinizi
            <span className="text-primary"> Hesaplayın</span>
          </h1>
          
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Türkiye'nin yatırım teşvik sistemi kapsamında sektör bazlı teşvik oranlarını sorgulayın, 
            Türkiye Yüzyılı teşviklerini hesaplayın ve yatırım planlarınızı optimize edin.
          </p>
          
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Button size="lg" onClick={scrollToFeatures} className="group">
              Başlayın
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg">
              Daha Fazla Bilgi
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-blue-500 p-2 text-white">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">Sektör Sorgusu</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Yüksek teknoloji, orta-yüksek teknoloji ve öncelikli sektörlerde geçerli teşvik oranlarını sorgulayın
                </p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-green-500 p-2 text-white">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">Teşvik Hesaplama</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Teknoloji Hamlesi, Yerel Kalkınma Hamlesi ve Stratejik Hamle kapsamında teşvik tutarlarını hesaplayın
                </p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-purple-500 p-2 text-white">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">Anında Sonuç</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Güncel mevzuata uygun hesaplamalar ile anında sonuç alın ve yatırım kararlarınızı optimize edin
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
