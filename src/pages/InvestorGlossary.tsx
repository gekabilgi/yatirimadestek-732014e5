
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import MainNavbar from '@/components/MainNavbar';
import StandardHero from '@/components/StandardHero';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookOpen } from 'lucide-react';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

const InvestorGlossary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  const isMobile = useIsMobile();

  // Turkish alphabet
  const turkishAlphabet = ['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H', 'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z'];

  // Fetch glossary terms
  const { data: termsData, isLoading } = useQuery({
    queryKey: ['glossary-terms', searchQuery, selectedLetter, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('glossary_terms')
        .select('*', { count: 'exact' });

      if (searchQuery) {
        query = query.or(`term.ilike.%${searchQuery}%,definition.ilike.%${searchQuery}%`);
      }

      if (selectedLetter) {
        query = query.ilike('term', `${selectedLetter}%`);
      }

      query = query
        .order('term', { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { terms: data || [], total: count || 0 };
    },
  });

  const handleLetterClick = (letter: string) => {
    if (selectedLetter === letter) {
      setSelectedLetter('');
    } else {
      setSelectedLetter(letter);
    }
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedLetter('');
    setCurrentPage(1);
  };

  const toggleTermExpansion = (termId: string) => {
    const newExpanded = new Set(expandedTerms);
    if (newExpanded.has(termId)) {
      newExpanded.delete(termId);
    } else {
      newExpanded.add(termId);
    }
    setExpandedTerms(newExpanded);
  };

  const totalPages = Math.ceil((termsData?.total || 0) / itemsPerPage);

  // Generate pagination range optimized for mobile
  const generatePaginationRange = () => {
    const range = [];
    const maxVisible = isMobile ? 3 : 5; // Show fewer pages on mobile
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);
      
      if (currentPage > 3 && !isMobile) {
        range.push('ellipsis-start');
      } else if (currentPage > 2 && isMobile) {
        range.push('ellipsis-start');
      }
      
      // Show current page and neighbors
      const start = Math.max(2, currentPage - (isMobile ? 0 : 1));
      const end = Math.min(totalPages - 1, currentPage + (isMobile ? 0 : 1));
      
      for (let i = start; i <= end; i++) {
        if (!range.includes(i)) {
          range.push(i);
        }
      }
      
      if (currentPage < totalPages - (isMobile ? 1 : 2)) {
        range.push('ellipsis-end');
      }
      
      // Always show last page if not already included
      if (!range.includes(totalPages) && totalPages > 1) {
        range.push(totalPages);
      }
    }
    
    return range;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Navigation */}
      <MainNavbar />
      
      <StandardHero
        title="Yatırımcı Sözlüğü"
        description="Yatırım teşvikleri ve prosedürleri ile ilgili terimleri keşfedin ve öğrenin."
        badge={{
          text: "Terim Sözlüğü",
          icon: BookOpen
        }}
        gradient="orange"
        compact
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Terim veya tanımda ara..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Alphabet Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Harfe Göre Filtrele</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {turkishAlphabet.map((letter) => (
                  <Button
                    key={letter}
                    variant={selectedLetter === letter ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLetterClick(letter)}
                    className="w-10 h-10"
                  >
                    {letter}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>
                {searchQuery && `"${searchQuery}" için sonuçlar`}
                {selectedLetter && `"${selectedLetter}" harfi ile başlayan terimler`}
                {!searchQuery && !selectedLetter && 'Tüm Terimler'}
                {termsData && ` (${termsData.total} terim)`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600">Yükleniyor...</p>
                </div>
              ) : termsData?.terms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Hiç terim bulunamadı.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {termsData?.terms.map((term) => {
                    const isExpanded = expandedTerms.has(term.id);
                    return (
                      <div key={term.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div 
                          className="flex justify-between items-start cursor-pointer"
                          onClick={() => toggleTermExpansion(term.id)}
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-primary mb-2">{term.term}</h3>
                            {isExpanded && (
                              <p className="text-gray-700 leading-relaxed">{term.definition}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="ml-4">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compact Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`h-8 ${isMobile ? 'w-8 px-0' : 'px-2'}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {!isMobile && <span className="ml-1">Önceki</span>}
                        </Button>
                      </PaginationItem>
                      
                      {generatePaginationRange().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                            <PaginationEllipsis className="h-8 w-8" />
                          ) : (
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page as number)}
                              className="h-8 w-8 px-0"
                            >
                              {page}
                            </Button>
                          )}
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`h-8 ${isMobile ? 'w-8 px-0' : 'px-2'}`}
                        >
                          {!isMobile && <span className="mr-1">Sonraki</span>}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvestorGlossary;
