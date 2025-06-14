
import React from 'react';
import { ArrowRight, Search, Calculator } from 'lucide-react';
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
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background py-4 sm:py-6">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border/10 hover:ring-border/20">
              9903 Sayılı Karar{' '}
              <span className="font-semibold text-primary"></span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Yeni Yatırım Teşvik
            <span className="text-primary"> Sistemi</span>
          </h1>
          
          {/* Colored Cards Section */}
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-lg bg-blue-500 p-2 text-white">
                      <Search className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">Sektör Sorgusu</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                   Hedef, Öncelikli (Yüksek teknoloji ve  Orta-Yüksek teknoloji) sektörlerde geçerli destekleri görün.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 mb-2">
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
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 mb-2">
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
      </div>
    </section>
  );
};

export default HeroSection;
