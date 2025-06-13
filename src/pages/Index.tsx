
import React, { useState } from 'react';
import { Search, Calculator } from 'lucide-react';
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
              <CardTitle className="text-center">Modül Seçimi</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant={activeModule === 'calculator' ? 'default' : 'outline'}
                  onClick={() => setActiveModule('calculator')}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Calculator className="h-4 w-4" />
                  Türkiye Yüzyılı Teşvikleri Hesaplama
                </Button>
                <Button
                  variant={activeModule === 'query' ? 'default' : 'outline'}
                  onClick={() => setActiveModule('query')}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Search className="h-4 w-4" />
                  Sektör Bazlı Teşvik Sorgusu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full">
          {activeModule === 'query' && (
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Search className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Yüksek Teknoloji, Orta-Yüksek Teknoloji, Hedef Sektörler, Öncelikli Sektörler Teşvik Sorgusu</h2>
              </div>
              <UnifiedIncentiveQuery />
              
              {/* Colored Cards Feature Grid - placed after sector selection */}
              <div className="mt-6 mb-4">
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
                        Yüksek teknoloji, orta-yüksek teknoloji ve öncelikli sektörlerde geçerli teşvik oranlarını sorgulayın
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
                          <Search className="h-5 w-5" />
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
          )}

          {activeModule === 'calculator' && (
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Calculator className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Teknoloji Hamlesi, Yerel Kalkınma Hamlesi ve Stratejik Hamle Kapsamında Teşvik Hesaplama</h2>
              </div>
              <IncentiveTypeCalculator />
              
              {/* Colored Cards Feature Grid - placed after calculator selection */}
              <div className="mt-6 mb-4">
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
                        Yüksek teknoloji, orta-yüksek teknoloji ve öncelikli sektörlerde geçerli teşvik oranlarını sorgulayın
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
                          <Search className="h-5 w-5" />
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
