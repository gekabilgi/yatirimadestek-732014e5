import React, { useState, useEffect } from 'react';
import { Search, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainNavbar from '@/components/MainNavbar';
import UnifiedIncentiveQuery from '@/components/UnifiedIncentiveQuery';
import IncentiveTypeCalculator from '@/components/IncentiveTypeCalculator';
import { useSearchParams } from 'react-router-dom';

const IncentiveTools = () => {
  const [searchParams] = useSearchParams();
  const moduleParam = searchParams.get('module') as 'query' | 'calculator';
  const [activeModule, setActiveModule] = useState<'query' | 'calculator'>(moduleParam || 'query');

  useEffect(() => {
    if (moduleParam === 'query' || moduleParam === 'calculator') {
      setActiveModule(moduleParam);
    }
  }, [moduleParam]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <MainNavbar />
      
      {/* Page Header */}
      <section className="relative py-16 sm:py-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl animate-fade-in">
            9903 Yatırım Teşvik
            <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Sistemi
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-4xl mx-auto font-medium">
            Teşvik araçlarını kullanarak yeni teşvik sisteminde size uygun olabilecek destekleri bulun, bilgi amaçlı sunulan teşvik tutarlarını hesaplayın.
          </p>
          <div className="mt-8 text-center">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary/10 to-blue-600/10 px-6 py-3 text-sm font-semibold text-primary border border-primary/20 shadow-sm">
              <span className="mr-3 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Türkiye Yüzyılı Kalkınma Hamlesi
            </span>
          </div>
        </div>
      </section>
      
      {/* Incentive Tools Section */}
      <div className="container mx-auto py-6">
        <div className="mb-12">
          <Card className="card-elevated border-0 animate-fade-in">
            <CardHeader className="pb-3 pt-6">
              <CardTitle className="text-center text-3xl font-bold">Teşvik Araçları</CardTitle>
              <p className="text-center text-lg text-gray-600 mt-2">
                İhtiyacınıza uygun modülü seçerek işlemlerinizi gerçekleştirebilirsiniz.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
                <Button
                  variant={activeModule === 'query' ? 'default' : 'outline'}
                  onClick={() => setActiveModule('query')}
                  className={`flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    activeModule === 'query' 
                      ? 'shadow-lg hover:shadow-xl' 
                      : 'hover:bg-primary/5 hover:border-primary/30'
                  }`}
                >
                  <Search className="h-5 w-5" />
                  Sektör Bazlı Teşvik Sorgusu
                </Button>
                <Button
                  variant={activeModule === 'calculator' ? 'default' : 'outline'}
                  onClick={() => setActiveModule('calculator')}
                  className={`flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    activeModule === 'calculator' 
                      ? 'shadow-lg hover:shadow-xl' 
                      : 'hover:bg-primary/5 hover:border-primary/30'
                  }`}
                >
                  <Calculator className="h-5 w-5" />
                  Türkiye Yüzyılı Teşvikleri Hesaplama
                </Button>
              </div>

              <div className="w-full animate-fade-in">
                {activeModule === 'query' && (
                  <div>
                    <div className="flex items-center gap-3 mb-8 justify-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Search className="h-6 w-6 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-center">Yüksek Teknoloji, Orta-Yüksek Teknoloji, Hedef Sektörler, Öncelikli Sektörler Teşvik Sorgusu</h2>
                    </div>
                    
                    <div className="max-w-7xl mx-auto space-y-8">
                      <UnifiedIncentiveQuery />
                    </div>
                  </div>
                )}

                {activeModule === 'calculator' && (
                  <div>
                    <div className="flex items-center gap-3 mb-8 justify-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calculator className="h-6 w-6 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-center">Teknoloji Hamlesi, Yerel Kalkınma Hamlesi ve Stratejik Hamle Kapsamında Teşvik Hesaplama</h2>
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