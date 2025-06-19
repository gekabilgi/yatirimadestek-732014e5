
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            9903 Yatırım Teşvik
            <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              {" "}Sistemi
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Teşvik araçlarını kullanarak yeni teşvik sisteminde size uygun olabilecek destekleri bulun, bilgi amaçlı sunulan teşvik tutarlarını hesaplayın.
          </p>
        </div
        <div className="mb-6 mt-6">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
              Türkiye Yüzyılı Kalkınma Hamlesi
            </span>
          </div>
      </section>
      
      {/* Incentive Tools Section */}
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-2xl">Teşvik Araçları</CardTitle>
              <p className="text-center text-gray-600">
                İhtiyacınıza uygun modülü seçerek işlemlerinizi gerçekleştirebilirsiniz.
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
