
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { SectorData } from '@/types/incentive';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SectorSearchProps {
  onSectorSelect: (sector: SectorData) => void;
  selectedSector: SectorData | null;
}

// Define the actual type returned by Supabase query
interface SupabaseSectorData {
  id: number;
  nace_kodu: string;
  sektor: string;
  hedef_yatirim: string | boolean;
  oncelikli_yatirim: string | boolean;
  yuksek_teknoloji: string | boolean;
  orta_yuksek_teknoloji: string | boolean;
  sartlar: string | null;
  bolge_1: number | null;
  bolge_2: number | null;
  bolge_3: number | null;
  bolge_4: number | null;
  bolge_5: number | null;
  bolge_6: number | null;
  created_at: string;
  updated_at: string;
}

const SectorSearch: React.FC<SectorSearchProps> = ({ onSectorSelect, selectedSector }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SectorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const convertBooleanValue = (value: string | boolean): "Evet" | "Hayır" => {
    if (typeof value === 'boolean') {
      return value ? "Evet" : "Hayır";
    }
    // Handle string values (for backward compatibility)
    return value === 'Evet' || value === 'true' ? "Evet" : "Hayır";
  };

  const convertToSectorData = (dbSector: SupabaseSectorData): SectorData => {
    return {
      nace_kodu: dbSector.nace_kodu,
      sektor: dbSector.sektor,
      hedef_yatirim: convertBooleanValue(dbSector.hedef_yatirim),
      oncelikli_yatirim: convertBooleanValue(dbSector.oncelikli_yatirim),
      yuksek_teknoloji: convertBooleanValue(dbSector.yuksek_teknoloji),
      orta_yuksek_teknoloji: convertBooleanValue(dbSector.orta_yuksek_teknoloji),
      sartlar: dbSector.sartlar || '',
      "1. Bolge": dbSector.bolge_1 || 0,
      "2. Bolge": dbSector.bolge_2 || 0,
      "3. Bolge": dbSector.bolge_3 || 0,
      "4. Bolge": dbSector.bolge_4 || 0,
      "5. Bolge": dbSector.bolge_5 || 0,
      "6. Bolge": dbSector.bolge_6 || 0
    };
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

    setIsLoading(true);
    try {
      const searchTermLower = searchTerm.toLowerCase().trim();
      
      const { data, error } = await supabase
        .from('sector_search')
        .select('*')
        .or(`nace_kodu.ilike.%${searchTermLower}%,sektor.ilike.%${searchTermLower}%`);

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Hata",
          description: "Arama sırasında bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }

      const convertedResults = data?.map(convertToSectorData) || [];
      setSearchResults(convertedResults);
      
      if (convertedResults.length === 0) {
        toast({
          title: "Sonuç Bulunamadı",
          description: "Arama kriterlerinize uygun sektör bulunamadı.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Arama Tamamlandı",
          description: `${convertedResults.length} sektör bulundu.`,
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
      setIsLoading(false);
    }
  };

  const handleSectorSelect = (sector: SectorData) => {
    onSectorSelect(sector);
    setSearchResults([]); // Clear search results after selection
    setSearchTerm(''); // Clear search term
    toast({
      title: "Sektör Seçildi",
      description: `${sector.sektor} sektörü seçildi.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Sektör Arama
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="NACE kodu veya sektör adı girin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? 'Aranıyor...' : 'Ara'}
            </Button>
          </div>

          {selectedSector && (
            <Card className="bg-primary/5 border-primary">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{selectedSector.sektor}</h4>
                    <Badge variant="outline">{selectedSector.nace_kodu}</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedSector.hedef_yatirim === "Evet" && <Badge variant="secondary">Hedef Yatırım</Badge>}
                    {selectedSector.oncelikli_yatirim === "Evet" && <Badge variant="secondary">Öncelikli Yatırım</Badge>}
                    {selectedSector.yuksek_teknoloji === "Evet" && <Badge variant="secondary">Yüksek Teknoloji</Badge>}
                    {selectedSector.orta_yuksek_teknoloji === "Evet" && <Badge variant="secondary">Orta-Yüksek Teknoloji</Badge>}
                  </div>
                  {selectedSector.sartlar && (
                    <p className="text-sm text-muted-foreground">{selectedSector.sartlar}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arama Sonuçları ({searchResults.length} sektör)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((sector, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSectorSelect(sector)}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{sector.sektor}</h4>
                        <Badge variant="outline">{sector.nace_kodu}</Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {sector.hedef_yatirim === "Evet" && <Badge variant="secondary" className="text-xs">Hedef</Badge>}
                        {sector.oncelikli_yatirim === "Evet" && <Badge variant="secondary" className="text-xs">Öncelikli</Badge>}
                        {sector.yuksek_teknoloji === "Evet" && <Badge variant="secondary" className="text-xs">Yüksek Tek.</Badge>}
                        {sector.orta_yuksek_teknoloji === "Evet" && <Badge variant="secondary" className="text-xs">Orta-Yüksek Tek.</Badge>}
                      </div>
                      {sector.sartlar && (
                        <p className="text-xs text-muted-foreground">{sector.sartlar}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SectorSearch;
