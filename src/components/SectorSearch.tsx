
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { SectorData } from '@/types/incentive';
import { toast } from '@/hooks/use-toast';

interface SectorSearchProps {
  onSectorSelect: (sector: SectorData) => void;
  selectedSector: SectorData | null;
}

// Mock sector_search data - this should be replaced with actual database data
const SECTOR_SEARCH_DATA: SectorData[] = [
  {
    nace_kodu: "25.11",
    sektor: "Metal yapı ve yapı elemanları imalatı",
    hedef_yatirim: "Evet",
    oncelikli_yatirim: "Hayır",
    yuksek_teknoloji: "Hayır",
    orta_yuksek_teknoloji: "Evet",
    sartlar: "Minimum 1 milyon TL yatırım",
    "1. Bolge": 1000000,
    "2. Bolge": 750000,
    "3. Bolge": 500000,
    "4. Bolge": 250000,
    "5. Bolge": 100000,
    "6. Bolge": 50000
  },
  {
    nace_kodu: "26.12",
    sektor: "Elektronik devre kartları imalatı",
    hedef_yatirim: "Evet",
    oncelikli_yatirim: "Evet",
    yuksek_teknoloji: "Evet",
    orta_yuksek_teknoloji: "Hayır",
    sartlar: "Ar-Ge departmanı zorunlu",
    "1. Bolge": 2000000,
    "2. Bolge": 1500000,
    "3. Bolge": 1000000,
    "4. Bolge": 500000,
    "5. Bolge": 250000,
    "6. Bolge": 100000
  },
  {
    nace_kodu: "28.11",
    sektor: "Motor ve türbin imalatı",
    hedef_yatirim: "Evet",
    oncelikli_yatirim: "Evet",
    yuksek_teknoloji: "Hayır",
    orta_yuksek_teknoloji: "Evet",
    sartlar: "ISO 9001 sertifikası gerekli",
    "1. Bolge": 1500000,
    "2. Bolge": 1000000,
    "3. Bolge": 750000,
    "4. Bolge": 400000,
    "5. Bolge": 200000,
    "6. Bolge": 100000
  },
  {
    nace_kodu: "20.13",
    sektor: "Plastik hammadde imalatı",
    hedef_yatirim: "Hayır",
    oncelikli_yatirim: "Hayır",
    yuksek_teknoloji: "Hayır",
    orta_yuksek_teknoloji: "Hayır",
    sartlar: "Çevre izni zorunlu",
    "1. Bolge": 500000,
    "2. Bolge": 400000,
    "3. Bolge": 300000,
    "4. Bolge": 200000,
    "5. Bolge": 100000,
    "6. Bolge": 50000
  },
  {
    nace_kodu: "26.30",
    sektor: "İletişim ekipmanları imalatı",
    hedef_yatirim: "Evet",
    oncelikli_yatirim: "Evet",
    yuksek_teknoloji: "Evet",
    orta_yuksek_teknoloji: "Hayır",
    sartlar: "Yazılım geliştirme merkezi gerekli",
    "1. Bolge": 3000000,
    "2. Bolge": 2000000,
    "3. Bolge": 1500000,
    "4. Bolge": 750000,
    "5. Bolge": 400000,
    "6. Bolge": 200000
  }
];

const SectorSearch: React.FC<SectorSearchProps> = ({ onSectorSelect, selectedSector }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SectorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const searchTermLower = searchTerm.toLowerCase().trim();
      
      // Filter sectors based on NACE code or sector name
      const filtered = SECTOR_SEARCH_DATA.filter(sector => 
        sector.nace_kodu.toLowerCase().includes(searchTermLower) ||
        sector.sektor.toLowerCase().includes(searchTermLower)
      );

      setSearchResults(filtered);
      
      if (filtered.length === 0) {
        toast({
          title: "Sonuç Bulunamadı",
          description: "Arama kriterlerinize uygun sektör bulunamadı.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Arama Tamamlandı",
          description: `${filtered.length} sektör bulundu.`,
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
