
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, Info } from 'lucide-react';
import { SectorSearchData } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const IncentiveEligibilitySearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SectorSearchData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir sektör adı veya NACE kodu girin.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    
    try {
      const searchTermLower = searchTerm.toLowerCase().trim();
      
      const { data, error } = await supabase
        .from('sector_search')
        .select('*')
        .or(`nace_kodu.ilike.%${searchTermLower}%,sektor.ilike.%${searchTermLower}%`)
        .order('sektor');

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Hata",
          description: "Arama sırasında bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }

      setSearchResults(data || []);
      setHasSearched(true);
      
      if (!data || data.length === 0) {
        toast({
          title: "Sonuç Bulunamadı",
          description: "Girilen kriterlere uygun sektör bulunamadı.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Arama Tamamlandı",
          description: `${data.length} sektör bulundu ve teşvik kapsamında.`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Hata",
        description: "Arama sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Teşvik Uygunluk Sorgulama
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sektör adı veya NACE kodu girerek teşvik uygunluğunu sorgulayın
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Örn: Tekstil, 13.10.01 gibi sektör adı veya NACE kodu girin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="whitespace-nowrap"
            >
              {isSearching ? 'Sorgulanıyor...' : 'Sorgula'}
            </Button>
          </div>

          {hasSearched && searchResults.length === 0 && (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-700">
                    Bu kriterlere uygun sektör teşvik kapsamında değildir.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-700">
                  {searchResults.length} sektör bulundu ve teşvik kapsamında!
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <Card key={result.id} className="border-2 border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-lg">{result.sektor}</h4>
                          <Badge variant="outline">{result.nace_kodu}</Badge>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {result.hedef_yatirim && (
                            <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                              Hedef Yatırım
                            </Badge>
                          )}
                          {result.oncelikli_yatirim && (
                            <Badge className="bg-green-600 text-white hover:bg-green-700">
                              Öncelikli Yatırım
                            </Badge>
                          )}
                          {result.yuksek_teknoloji && (
                            <Badge className="bg-orange-600 text-white hover:bg-orange-700">
                              Yüksek Teknoloji
                            </Badge>
                          )}
                          {result.orta_yuksek_teknoloji && (
                            <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                              Orta-Yüksek Teknoloji
                            </Badge>
                          )}
                        </div>
                        
                        {result.sartlar && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-800 mb-1">Özel Şartlar:</p>
                                <p className="text-sm text-blue-700">{result.sartlar}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div className="p-2 bg-gray-50 rounded">
                            <span className="text-muted-foreground">1. Bölge:</span>
                            <span className="ml-1 font-medium">{result.bolge_1?.toLocaleString('tr-TR')} TL</span>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <span className="text-muted-foreground">2. Bölge:</span>
                            <span className="ml-1 font-medium">{result.bolge_2?.toLocaleString('tr-TR')} TL</span>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <span className="text-muted-foreground">3. Bölge:</span>
                            <span className="ml-1 font-medium">{result.bolge_3?.toLocaleString('tr-TR')} TL</span>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <span className="text-muted-foreground">4. Bölge:</span>
                            <span className="ml-1 font-medium">{result.bolge_4?.toLocaleString('tr-TR')} TL</span>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <span className="text-muted-foreground">5. Bölge:</span>
                            <span className="ml-1 font-medium">{result.bolge_5?.toLocaleString('tr-TR')} TL</span>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <span className="text-muted-foreground">6. Bölge:</span>
                            <span className="ml-1 font-medium">{result.bolge_6?.toLocaleString('tr-TR')} TL</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncentiveEligibilitySearch;
