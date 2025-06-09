
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Search } from 'lucide-react';
import IncentiveWizard from '@/components/IncentiveWizard';
import IncentiveEligibilitySearch from '@/components/IncentiveEligibilitySearch';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Yatırım Teşvik Sistemi</h1>
          <p className="text-muted-foreground">
            9903 Sayılı Kararnameye göre yatırım teşviklerinizi hesaplayın ve uygunluk sorgulayın
          </p>
        </div>
        
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Uygunluk Sorgulama
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Teşvik Hesaplama
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="mt-6">
            <IncentiveEligibilitySearch />
          </TabsContent>
          
          <TabsContent value="calculator" className="mt-6">
            <IncentiveWizard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
