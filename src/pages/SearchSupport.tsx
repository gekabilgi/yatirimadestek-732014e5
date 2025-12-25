import React from 'react';
import { SearchBar } from '@/components/SearchBar';
import { SupportList } from '@/components/SupportList';
import { SearchFilters } from '@/types/support';
import MainNavbar from '@/components/MainNavbar';
import StandardHero from '@/components/StandardHero';
import { Target } from 'lucide-react';
import { useHybridSupportSearch } from '@/hooks/useHybridSupportSearch';

const SearchSupport = () => {
  const { programs, loading, initialLoadComplete, search } = useHybridSupportSearch();
  const [filters, setFilters] = React.useState<SearchFilters>({});

  const handleSearch = (searchFilters: SearchFilters) => {
    setFilters(searchFilters);
    search(searchFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <StandardHero
        title="Destek Programları"
        description="Size uygun destek programlarını bulun ve başvuru süreçlerinizi kolaylaştırın."
        badge={{
          text: "Aktif Destek Çağrıları",
          icon: Target
        }}
        compact
      />
      
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SearchBar onSearch={handleSearch} filters={filters} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SupportList programs={programs} isLoading={loading || !initialLoadComplete} />
      </div>
    </div>
  );
};

export default SearchSupport;
