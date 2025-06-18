
import React, { useState } from 'react';
import { Search, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainNavbar from '@/components/MainNavbar';
import UnifiedIncentiveQuery from '@/components/UnifiedIncentiveQuery';
import IncentiveTypeCalculator from '@/components/IncentiveTypeCalculator';

const IncentiveTools = () => {
  const [activeModule, setActiveModule] = useState<'query' | 'calculator'>('query');

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      {/* Page Header */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Teşvik Araçları
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Yeni teşvik sisteminde size uygun destekleri bulun, teşvik tutarlarını hesaplayın ve 
            yatırım kararlarınızı en doğru verilerle optimize edin.
          </p>
        </div>
      </section>
      
      {/* Incentive Tools Section */}
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-2xl">Teşvik Araçları</CardTitle>
              <p className="text-center text-gray-600">
                İhtiyacınıza uygun modülü seçerek işlemlerinizi gerçekleştirin
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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
                    <div className="flex items-center gap-2 mb-6 justify-center">
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
                    <div className="flex items-center gap-2 mb-6 justify-center">
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

export default IncentiveTools;
