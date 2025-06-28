import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Target, Star, Zap, Cpu } from 'lucide-react';
import { SectorSearchData } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SectorSearchStepProps {
  selectedSector: SectorSearchData | null;
  onSectorSelect: (sector: SectorSearchData) => void;
}

const SectorSearchStep: React.FC<SectorSearchStepProps> = ({
  selectedSector,
  onSectorSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SectorSearchData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Clear previous search results and selected sector when user starts typing
    if (searchResults.length > 0) {
      setSearchResults([]);
    }
    if (selectedSector) {
      onSectorSelect(null as any);
    }
  };

  // Function to normalize NACE code by removing dots
  const normalizeNaceCode = (code: string): string => {
    return code.replace(/\./g, '');
  };

  // Function to add dots to NACE code for proper formatting
  const formatNaceCode = (code: string): string => {
    const normalized = normalizeNaceCode(code);
    
    // Format based on length
    if (normalized.length >= 5) {
      // Format as XX.XX.XX
      return `${normalized.slice(0, 2)}.${normalized.slice(2, 4)}.${normalized.slice(4)}`;
    } else if (normalized.length >= 3) {
      // Format as XX.XX
      return `${normalized.slice(0, 2)}.${normalized.slice(2)}`;
    } else {
      // Keep as is if less than 3 characters
      return normalized;
    }
  };

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
  try {
    const rawInput = searchTerm.trim();
    const isNaceSearch = /\d/.test(rawInput); // Contains number = likely NACE

    let data = null;
    let error = null;

    if (isNaceSearch) {
      const clean = rawInput.replace(/\./g, ''); // e.g., 051001

      const formatted = insertDots(clean); // e.g., 05.10.01

      // Try to match both cleaned and formatted versions
      const result = await supabase
        .from("sector_search")
        .select("*")
        .or(`nace_kodu.ilike.${clean}%,nace_kodu.ilike.${formatted}%`)
        .order("sektor");

      data = result.data;
      error = result.error;
    } else {
      // Sector name search
      const result = await supabase
        .from("sector_search")
        .select("*")
        .ilike("sektor", `%${rawInput.toLowerCase()}%`)
        .order("sektor");

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Search error:", error);
      toast({
        title: "Hata",
        description: "Arama sırasında bir hata oluştu.",
        variant: "destructive",
      });
      return;
    }

    setSearchResults(data || []);

    if (!data || data.length === 0) {
      toast({
        title: "Sonuç Bulunamadı",
        description: "Girilen kriterlere uygun sektör bulunamadı.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Arama Tamamlandı",
        description: `${data.length} sektör bulundu.`,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    toast({
      title: "Hata",
      description: "Arama sırasında bir hata oluştu.",
      variant: "destructive",
    });
  } finally {
    setIsSearching(false);
  }
};

// 👇 Helper function: insert dots into NACE code
const insertDots = (code: string): string => {
  if (code.length >= 6) return `${code.slice(0, 2)}.${code.slice(2, 4)}.${code.slice(4)}`;
  if (code.length >= 4) return `${code.slice(0, 2)}.${code.slice(2, 4)}`;
  if (code.length >= 2) return `${code.slice(0, 2)}.${code.slice(2)}`;
  return code;
};


  const handleSectorSelect = (sector: SectorSearchData) => {
    onSectorSelect(sector);
    setSearchResults([]);
    setSearchTerm('');
    toast({
      title: "Sektör Seçildi",
      description: `${sector.sektor} sektörü seçildi.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="NACE kodu veya sektör adı girin... (örn: 13.10.01, 131001, 13.1, 131, Tekstil)"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch} 
          disabled={isSearching}
          className="whitespace-nowrap"
        >
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? 'Aranıyor...' : 'Ara'}
        </Button>
      </div>

      {selectedSector && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">{selectedSector.sektor}</h4>
                <Badge variant="outline" className="text-sm">{selectedSector.nace_kodu}</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedSector.hedef_yatirim && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Hedef Yatırım
                  </Badge>
                )}
                {selectedSector.oncelikli_yatirim && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Öncelikli Yatırım
                  </Badge>
                )}
                {selectedSector.yuksek_teknoloji && (
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Yüksek Teknoloji
                  </Badge>
                )}
                {selectedSector.orta_yuksek_teknoloji && (
                  <Badge className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    Orta-Yüksek Teknoloji
                  </Badge>
                )}
              </div>
              {selectedSector.sartlar && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-1">Özel Şartlar:</p>
                  <p className="text-sm text-blue-700">{selectedSector.sartlar}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {searchResults.map((result) => (
            <Card 
              key={result.id} 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleSectorSelect(result)}
            >
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{result.sektor}</h4>
                    <Badge variant="outline">{result.nace_kodu}</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {result.hedef_yatirim && (
                      <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs flex items-center gap-1">
                        <Target className="h-2.5 w-2.5" />
                        Hedef
                      </Badge>
                    )}
                    {result.oncelikli_yatirim && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs flex items-center gap-1">
                        <Star className="h-2.5 w-2.5" />
                        Öncelikli
                      </Badge>
                    )}
                    {result.yuksek_teknoloji && (
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5" />
                        Yüksek Tek.
                      </Badge>
                    )}
                    {result.orta_yuksek_teknoloji && (
                      <Badge className="bg-purple-500 hover:bg-purple-600 text-white text-xs flex items-center gap-1">
                        <Cpu className="h-2.5 w-2.5" />
                        Orta-Yüksek Tek.
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectorSearchStep;
