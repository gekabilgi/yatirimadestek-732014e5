
import React from 'react';
import { Search } from 'lucide-react';
import UnifiedIncentiveQuery from '@/components/UnifiedIncentiveQuery';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Yatırım Teşvik Sistemi</h1>
          <p className="text-muted-foreground">
            9903 Sayılı Kararnameye göre yatırım teşviklerinizi sorgulayın ve hesaplayın
          </p>
        </div>
        
        <div className="w-full">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Search className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Teşvik Sorgusu</h2>
          </div>
          
          <UnifiedIncentiveQuery />
        </div>
      </div>
    </div>
  );
};

export default Index;
