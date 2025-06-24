
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

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

  // Turkish alphabet
  const turkishAlphabet = ['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H', 'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'Q', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'W', 'X', 'Y', 'Z'];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Yatırımcı Sözlüğü</h1>
            <p className="text-gray-600">Yatırım teşvikleri ve prosedürleri ile ilgili terimler</p>
          </div>
        </div>
      </div>

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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
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
