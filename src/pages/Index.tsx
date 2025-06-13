
import React, { useState } from 'react';
import { Search, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UnifiedIncentiveQuery from '@/components/UnifiedIncentiveQuery';
import IncentiveTypeCalculator from '@/components/IncentiveTypeCalculator';

const Index = () => {
  const [activeModule, setActiveModule] = useState<'query' | 'calculator'>('query');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Yatırım Teşvik Sistemi</h1>
          <p className="text-muted-foreground">
            9903 Sayılı Kararnameye göre yatırım teşviklerinizi sorgulayın ve hesaplayın
          </p>
        </div>

        {/* Module Selection */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Modül Seçimi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant={activeModule === 'query' ? 'default' : 'outline'}
                  onClick={() => setActiveModule('query')}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Sektör Bazlı Teşvik Sorgusu
                </Button>
                <Button
                  variant={activeModule === 'calculator' ? 'default' : 'outline'}
                  onClick={() => setActiveModule('calculator')}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Türkiye Yüzyılı Teşvikleri Hesaplama
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full">
          {activeModule === 'query' && (
            <div>
              <div className="flex items-center gap-2 mb-6 justify-center">
                <Search className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Yüksek Teknoloji, Orta-Yüksek Teknoloji, Hedef Sektörler, Öncelikli Sektörler Teşvik Sorgusu</h2>
              </div>
              <UnifiedIncentiveQuery />
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
      </div>
    </div>
  );
};

export default Index;
