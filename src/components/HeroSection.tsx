
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background py-12 sm:py-16">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border/10 hover:ring-border/20">
              9903 Sayılı Karara uygun{' '}
              <span className="font-semibold text-primary">güncel teşvik oranları</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Yatırım Teşviklerinizi
            <span className="text-primary"> Hesaplayın</span>
          </h1>
          
          <p className="mt-2 text-lg leading-8 text-muted-foreground">
            Türkiye'nin yatırım teşvik sistemi kapsamında sektör bazlı teşvik oranlarını sorgulayın, 
            Türkiye Yüzyılı teşviklerini hesaplayın ve yatırım planlarınızı optimize edin.
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-x-6">
            <Button size="lg" onClick={scrollToFeatures} className="group">
              Başlayın
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg">
              Daha Fazla Bilgi
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
