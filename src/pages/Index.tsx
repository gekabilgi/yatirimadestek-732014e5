
import React, { useState } from 'react';
import { Search, Calculator, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import UnifiedIncentiveQuery from '@/components/UnifiedIncentiveQuery';
import IncentiveTypeCalculator from '@/components/IncentiveTypeCalculator';

const Index = () => {
  const [activeModule, setActiveModule] = useState<'query' | 'calculator'>('query');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      
      <div className="container mx-auto py-4" id="features-section">
        {/* Module Selection */}
        <div className="mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-center"></CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant={activeModule === 'query' ? 'default' : 'outline'}
                  onClick={() => setActiveModule('query')}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Search className="h-4 w-4" />
                  Sektör Bazlı Teşvik Sorgusu
                </Button>
                <Button
                  variant={activeModule === 'calculator' ? 'default' : 'outline'}
                  onClick={() => setActiveModule('calculator')}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Calculator className="h-4 w-4" />
                  Türkiye Yüzyılı Teşvikleri Hesaplama
                </Button>
              </div>
              <div className="w-full">
          {activeModule === 'query' && (
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Search className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Yüksek Teknoloji, Orta-Yüksek Teknoloji, Hedef Sektörler, Öncelikli Sektörler Teşvik Sorgusu</h2>
              </div>
              
              <div className="max-w-6xl mx-auto space-y-6">
                <UnifiedIncentiveQuery />
              </div>
            </div>
          )}

          {activeModule === 'calculator' && (
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Calculator className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Teknoloji Hamlesi, Yerel Kalkınma Hamlesi ve Stratejik Hamle Kapsamında Teşvik Hesaplama</h2>
              </div>
              <IncentiveTypeCalculator />
            </div>
          )}
        </div>
            </CardContent>
          </Card>
        </div>
        
        
      </div>
    </div>
  );
};

export default Index;
