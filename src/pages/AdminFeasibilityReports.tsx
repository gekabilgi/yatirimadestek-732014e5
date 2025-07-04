import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Plus, Edit, Trash2, Copy, Download, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface FeasibilityReport {
  id: string;
  yatirim_konusu: string;
  fizibilitenin_hazirlanma_tarihi: string | null;
  guncellenme_tarihi: string | null;
  nace_kodu_tanim: string | null;
  gtip_kodu_tag: string | null;
  hedef_ulke_tag: string | null;
  ust_sektor_tanim_tag: string | null;
  alt_sektor_tanim_tag: string | null;
  sabit_yatirim_tutari_aralik_tag: string | null;
  kalkinma_ajansi_tag: string | null;
  il_tag: string | null;
  ska_tag: string | null;
  yatirim_boyutu_tag: string | null;
  keywords_tag: string | null;
  sabit_yatirim_tutari: number | null;
  istihdam: number | null;
  geri_odeme_suresi: number | null;
  dokumanlar: string | null;
  link: string | null;
  created_at: string;
  updated_at: string;
}

const AdminFeasibilityReports = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<FeasibilityReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    il_tag: '',
    yatirim_boyutu_tag: '',
    ska_tag: '',
  });

  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-feasibility-reports', searchTerm, filters],
    queryFn: async () => {
      let query = supabase
        .from('investment_feasibility_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('yatirim_konusu', `%${searchTerm}%`);
      }

      if (filters.il_tag) {
        query = query.ilike('il_tag', `%${filters.il_tag}%`);
      }

      if (filters.yatirim_boyutu_tag) {
        query = query.ilike('yatirim_boyutu_tag', `%${filters.yatirim_boyutu_tag}%`);
      }

      if (filters.ska_tag) {
        query = query.ilike('ska_tag', `%${filters.ska_tag}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FeasibilityReport[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newReport: Omit<FeasibilityReport, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('investment_feasibility_reports')
        .insert([newReport])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feasibility-reports'] });
      toast.success('Fizibilite raporu başarıyla eklendi');
      setIsModalOpen(false);
      setEditingReport(null);
    },
    onError: (error) => {
      toast.error('Rapor eklenirken hata oluştu: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedReport: FeasibilityReport) => {
      const { data, error } = await supabase
        .from('investment_feasibility_reports')
        .update(updatedReport)
        .eq('id', updatedReport.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feasibility-reports'] });
      toast.success('Fizibilite raporu başarıyla güncellendi');
      setIsModalOpen(false);
      setEditingReport(null);
    },
    onError: (error) => {
      toast.error('Rapor güncellenirken hata oluştu: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investment_feasibility_reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feasibility-reports'] });
      toast.success('Fizibilite raporu başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Rapor silinirken hata oluştu: ' + error.message);
    },
  });

  // Enhanced form state for multi-select fields
  const [formState, setFormState] = useState({
    naceKodlari: [] as string[],
    iller: [] as string[],
    yatirimBoyutlari: [] as string[],
    sdgSecilimleri: [] as string[],
    gtipKodlari: [] as string[],
    ustSektorler: [] as string[],
    altSektorler: [] as string[],
    kalkinmaAjanslari: [] as string[]
  });

  // Data queries for dropdowns
  const { data: naceData } = useQuery({
    queryKey: ['nace-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nace_codes')
        .select('code, description')
        .order('code');
      if (error) throw error;
      return data;
    }
  });

  const { data: provincesData } = useQuery({
    queryKey: ['provinces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provinces')
        .select('name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const reportData = {
      yatirim_konusu: formData.get('yatirim_konusu') as string,
      fizibilitenin_hazirlanma_tarihi: formData.get('fizibilitenin_hazirlanma_tarihi') as string || null,
      guncellenme_tarihi: formData.get('guncellenme_tarihi') as string || null,
      nace_kodu_tanim: formState.naceKodlari.join('|') || null,
      gtip_kodu_tag: formState.gtipKodlari.join('|') || null,
      hedef_ulke_tag: formData.get('hedef_ulke_tag') as string || null,
      ust_sektor_tanim_tag: formState.ustSektorler.join('|') || null,
      alt_sektor_tanim_tag: formState.altSektorler.join('|') || null,
      sabit_yatirim_tutari_aralik_tag: formData.get('sabit_yatirim_tutari_aralik_tag') as string || null,
      kalkinma_ajansi_tag: formState.kalkinmaAjanslari.join('|') || null,
      il_tag: formState.iller.join('|') || null,
      ska_tag: formState.sdgSecilimleri.join('|') || null,
      yatirim_boyutu_tag: formState.yatirimBoyutlari.join('|') || null,
      keywords_tag: formData.get('keywords_tag') as string || null,
      sabit_yatirim_tutari: parseFloat(formData.get('sabit_yatirim_tutari') as string) || null,
      istihdam: parseInt(formData.get('istihdam') as string) || null,
      geri_odeme_suresi: parseFloat(formData.get('geri_odeme_suresi') as string) || null,
      dokumanlar: formData.get('dokumanlar') as string || null,
      link: formData.get('link') as string || null,
    };

    if (editingReport) {
      updateMutation.mutate({ ...editingReport, ...reportData });
    } else {
      createMutation.mutate(reportData);
    }
  };

  const handleEdit = (report: FeasibilityReport) => {
    setEditingReport(report);
    setIsModalOpen(true);
  };

  const handleClone = (report: FeasibilityReport) => {
    setEditingReport({ ...report, id: '', yatirim_konusu: `${report.yatirim_konusu} (Kopya)` });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu fizibilite raporunu silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const exportToExcel = () => {
    toast.info('Excel dışa aktarma özelliği yakında eklenecek');
  };

  // Prepare dropdown options
  const naceOptions: MultiSelectOption[] = (naceData || []).map(item => ({
    label: item.code,
    value: item.code,
    description: item.description
  }));

  const provinceOptions: MultiSelectOption[] = (provincesData || []).map(item => ({
    label: item.name,
    value: item.name
  }));

  const yatirimBoyutuOptions: MultiSelectOption[] = [
    { label: 'Yerel', value: 'Yerel' },
    { label: 'Ulusal', value: 'Ulusal' },
    { label: 'Küresel', value: 'Küresel' }
  ];

  const sdgOptions = [
    { number: '1', name: 'No Poverty' },
    { number: '2', name: 'Zero Hunger' },
    { number: '3', name: 'Good Health and Well-being' },
    { number: '4', name: 'Quality Education' },
    { number: '5', name: 'Gender Equality' },
    { number: '6', name: 'Clean Water and Sanitation' },
    { number: '7', name: 'Affordable and Clean Energy' },
    { number: '8', name: 'Decent Work and Economic Growth' },
    { number: '9', name: 'Industry, Innovation and Infrastructure' },
    { number: '10', name: 'Reduced Inequalities' },
    { number: '11', name: 'Sustainable Cities and Communities' },
    { number: '12', name: 'Responsible Consumption and Production' },
    { number: '13', name: 'Climate Action' },
    { number: '14', name: 'Life Below Water' },
    { number: '15', name: 'Life on Land' },
    { number: '16', name: 'Peace, Justice and Strong Institutions' },
    { number: '17', name: 'Partnerships for the Goals' }
  ];

  const ustSektorOptions: MultiSelectOption[] = [
    { label: 'Industry', value: 'Industry' },
    { label: 'Agriculture', value: 'Agriculture' },
    { label: 'Mining', value: 'Mining' },
    { label: 'Energy', value: 'Energy' },
    { label: 'Services', value: 'Services' }
  ];

  const altSektorOptions: MultiSelectOption[] = [
    "Wood Products and Furniture Manufacturing",
    "Basic Metal Industry",
    "Waste Disposal and Recycling",
    "ICT and Optical Products Manufacturing",
    "IT and Media Services",
    "Crop Production",
    "Leather and Related Products Manufacturing",
    "Education",
    "Electrical Equipment Manufacturing",
    "Energy Production",
    "Finance, Insurance and Real Estate",
    "Food Products Manufacturing",
    "Animal Husbandry",
    "Beverage Manufacturing",
    "Construction",
    "Paper and Paper Products Manufacturing",
    "Rubber and Plastic Products Manufacturing",
    "Chemical Products Manufacturing",
    "Coal and Petroleum Products Manufacturing",
    "Sand, Clay, Stone and Mineral Mining",
    "Logistics and Maintenance",
    "Mining Exploration and Drilling",
    "Machinery Installation, Maintenance and Repair",
    "Machinery and Equipment Manufacturing",
    "Medical Products Manufacturing",
    "Metal Ore Mining",
    "Metal Products Manufacturing",
    "Measurement and Testing Equipment Manufacturing",
    "Organic Agriculture and Livestock",
    "Forestry",
    "Automotive Industry",
    "Healthcare",
    "Defense Industry Manufacturing",
    "Greenhouse Agriculture",
    "Ceramic and Glass Products Manufacturing",
    "Socio-Cultural Activities",
    "Sports Equipment and Musical Instrument Manufacturing",
    "Fisheries",
    "Agro-Industry",
    "Building Materials Manufacturing from Stone and Earth",
    "Textile and Apparel Manufacturing",
    "Tourism",
    "Transport Vehicle Manufacturing",
    "Creative Industries"
  ].map(sector => ({ label: sector, value: sector }));

  const kalkinmaAjansiOptions: MultiSelectOption[] = [
    "İstanbul Kalkınma Ajansı (İSTKA)",
    "Ankara Kalkınma Ajansı (ANKARAKA)",
    "İzmir Kalkınma Ajansı (İZKA)",
    "Bursa Eskişehir Bilecik Kalkınma Ajansı (BEBKA)",
    "Doğu Marmara Kalkınma Ajansı (MARKA)",
    "Trakya Kalkınma Ajansı (TRAKYAKA)",
    "Güney Marmara Kalkınma Ajansı (GMKA)",
    "Zafer Kalkınma Ajansı (ZAFERKA)",
    "Mevlana Kalkınma Ajansı (MEVKA)",
    "Orta Anadolu Kalkınma Ajansı (ORAN)",
    "Ahiler Kalkınma Ajansı (AHİKA)",
    "İç Anadolu Kalkınma Ajansı (İKA)",
    "Batı Akdeniz Kalkınma Ajansı (BAKA)",
    "Güney Ege Kalkınma Ajansı (GEKA)",
    "Doğu Akdeniz Kalkınma Ajansı (DOĞAKA)",
    "Çukurova Kalkınma Ajansı (ÇKA)",
    "Batı Karadeniz Kalkınma Ajansı (BAKKA)",
    "Orta Karadeniz Kalkınma Ajansı (OKA)",
    "Doğu Karadeniz Kalkınma Ajansı (DOKA)",
    "Kuzeydoğu Anadolu Kalkınma Ajansı (KUDAKA)",
    "Serhat Kalkınma Ajansı (SERKA)",
    "Dicle Kalkınma Ajansı (DİKA)",
    "Karacadağ Kalkınma Ajansı (KARACADAĞ)",
    "İpekyolu Kalkınma Ajansı (İKA)",
    "Fırat Kalkınma Ajansı (FKA)",
    "Kuzey Anadolu Kalkınma Ajansı (KUZKA)"
  ].map(ajansi => ({ label: ajansi, value: ajansi }));

  // Reset form state when editing changes
  React.useEffect(() => {
    if (editingReport) {
      setFormState({
        naceKodlari: editingReport.nace_kodu_tanim?.split('|').filter(Boolean) || [],
        iller: editingReport.il_tag?.split('|').filter(Boolean) || [],
        yatirimBoyutlari: editingReport.yatirim_boyutu_tag?.split('|').filter(Boolean) || [],
        sdgSecilimleri: editingReport.ska_tag?.split('|').filter(Boolean) || [],
        gtipKodlari: editingReport.gtip_kodu_tag?.split('|').filter(Boolean) || [],
        ustSektorler: editingReport.ust_sektor_tanim_tag?.split('|').filter(Boolean) || [],
        altSektorler: editingReport.alt_sektor_tanim_tag?.split('|').filter(Boolean) || [],
        kalkinmaAjanslari: editingReport.kalkinma_ajansi_tag?.split('|').filter(Boolean) || []
      });
    } else {
      setFormState({
        naceKodlari: [],
        iller: [],
        yatirimBoyutlari: [],
        sdgSecilimleri: [],
        gtipKodlari: [],
        ustSektorler: [],
        altSektorler: [],
        kalkinmaAjanslari: []
      });
    }
  }, [editingReport]);

  return (
    <AdminLayout>
      <div className="space-y-6 mt-16">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fizibilite Raporları</h1>
            <p className="text-gray-600">Yatırım fizibilite raporlarını yönetin</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel'e Aktar
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingReport(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Rapor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingReport ? 'Raporu Düzenle' : 'Yeni Fizibilite Raporu'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="yatirim_konusu">Yatırım Konusu *</Label>
                      <Input
                        id="yatirim_konusu"
                        name="yatirim_konusu"
                        defaultValue={editingReport?.yatirim_konusu || ''}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fizibilitenin_hazirlanma_tarihi">Hazırlanma Tarihi</Label>
                      <Input
                        id="fizibilitenin_hazirlanma_tarihi"
                        name="fizibilitenin_hazirlanma_tarihi"
                        type="date"
                        defaultValue={editingReport?.fizibilitenin_hazirlanma_tarihi || ''}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="guncellenme_tarihi">Güncellenme Tarihi</Label>
                      <Input
                        id="guncellenme_tarihi"
                        name="guncellenme_tarihi"
                        type="date"
                        defaultValue={editingReport?.guncellenme_tarihi || ''}
                      />
                    </div>

                {/* Enhanced NACE Codes Multi-Select */}
                <div className="md:col-span-2">
                  <Label>NACE Kodu Tanımı</Label>
                  <MultiSelect
                    options={naceOptions}
                    selected={formState.naceKodlari}
                    onChange={(selected) => setFormState(prev => ({ ...prev, naceKodlari: selected }))}
                    placeholder="NACE kodlarını seçin..."
                    searchPlaceholder="NACE kodu ara..."
                    formatLabel={(option) => `${option.label} - ${option.description}`}
                  />
                </div>

                {/* Enhanced Province Multi-Select */}
                <div>
                  <Label>İl</Label>
                  <MultiSelect
                    options={provinceOptions}
                    selected={formState.iller}
                    onChange={(selected) => setFormState(prev => ({ ...prev, iller: selected }))}
                    placeholder="İlleri seçin..."
                    searchPlaceholder="İl ara..."
                  />
                </div>

                {/* Enhanced Investment Scale Multi-Select */}
                <div>
                  <Label>Yatırım Boyutu</Label>
                  <MultiSelect
                    options={yatirimBoyutuOptions}
                    selected={formState.yatirimBoyutlari}
                    onChange={(selected) => setFormState(prev => ({ ...prev, yatirimBoyutlari: selected }))}
                    placeholder="Yatırım boyutunu seçin..."
                  />
                </div>

                {/* Enhanced SDG Checkboxes */}
                <div className="md:col-span-2">
                  <Label>SKA Etiketleri (Sürdürülebilir Kalkınma Amaçları)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 p-4 border rounded-md max-h-40 overflow-y-auto">
                    {sdgOptions.map((sdg) => (
                      <div key={sdg.number} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sdg-${sdg.number}`}
                          checked={formState.sdgSecilimleri.includes(sdg.number)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormState(prev => ({
                                ...prev,
                                sdgSecilimleri: [...prev.sdgSecilimleri, sdg.number]
                              }));
                            } else {
                              setFormState(prev => ({
                                ...prev,
                                sdgSecilimleri: prev.sdgSecilimleri.filter(id => id !== sdg.number)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`sdg-${sdg.number}`} className="text-sm">
                          SDG {sdg.number}: {sdg.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Upper Sector Multi-Select */}
                <div>
                  <Label>Üst Sektör</Label>
                  <MultiSelect
                    options={ustSektorOptions}
                    selected={formState.ustSektorler}
                    onChange={(selected) => setFormState(prev => ({ ...prev, ustSektorler: selected }))}
                    placeholder="Üst sektörleri seçin..."
                  />
                </div>

                {/* Enhanced Lower Sector Multi-Select */}
                <div>
                  <Label>Alt Sektör</Label>
                  <MultiSelect
                    options={altSektorOptions}
                    selected={formState.altSektorler}
                    onChange={(selected) => setFormState(prev => ({ ...prev, altSektorler: selected }))}
                    placeholder="Alt sektörleri seçin..."
                    searchPlaceholder="Sektör ara..."
                  />
                </div>

                {/* Enhanced Development Agency Multi-Select */}
                <div className="md:col-span-2">
                  <Label>Kalkınma Ajansı</Label>
                  <MultiSelect
                    options={kalkinmaAjansiOptions}
                    selected={formState.kalkinmaAjanslari}
                    onChange={(selected) => setFormState(prev => ({ ...prev, kalkinmaAjanslari: selected }))}
                    placeholder="Kalkınma ajanslarını seçin..."
                    searchPlaceholder="Ajans ara..."
                  />
                </div>

                <div>
                  <Label htmlFor="sabit_yatirim_tutari">Sabit Yatırım Tutarı</Label>
                  <Input
                    id="sabit_yatirim_tutari"
                    name="sabit_yatirim_tutari"
                    type="number"
                    defaultValue={editingReport?.sabit_yatirim_tutari || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="istihdam">İstihdam</Label>
                  <Input
                    id="istihdam"
                    name="istihdam"
                    type="number"
                    defaultValue={editingReport?.istihdam || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="geri_odeme_suresi">Geri Ödeme Süresi (Ay)</Label>
                  <Input
                    id="geri_odeme_suresi"
                    name="geri_odeme_suresi"
                    type="number"
                    defaultValue={editingReport?.geri_odeme_suresi || ''}
                  />
                </div>

                <div>
                  <Label htmlFor="hedef_ulke_tag">Hedef Ülke</Label>
                  <Input
                    id="hedef_ulke_tag"
                    name="hedef_ulke_tag"
                    defaultValue={editingReport?.hedef_ulke_tag || ''}
                  />
                </div>

                <div>
                  <Label htmlFor="sabit_yatirim_tutari_aralik_tag">Yatırım Tutarı Aralığı</Label>
                  <Input
                    id="sabit_yatirim_tutari_aralik_tag"
                    name="sabit_yatirim_tutari_aralik_tag"
                    defaultValue={editingReport?.sabit_yatirim_tutari_aralik_tag || ''}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="keywords_tag">Anahtar Kelimeler (| ile ayırın)</Label>
                  <Input
                    id="keywords_tag"
                    name="keywords_tag"
                    defaultValue={editingReport?.keywords_tag || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dokumanlar">Doküman Adı</Label>
                  <Input
                    id="dokumanlar"
                    name="dokumanlar"
                    defaultValue={editingReport?.dokumanlar || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="link">İndirme Linki</Label>
                  <Input
                    id="link"
                    name="link"
                    type="url"
                    defaultValue={editingReport?.link || ''}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingReport ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rapor adı ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="filter-il">İl</Label>
                  <Input
                    id="filter-il"
                    placeholder="İl filtresi"
                    value={filters.il_tag}
                    onChange={(e) => setFilters(prev => ({ ...prev, il_tag: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="filter-boyut">Yatırım Boyutu</Label>
                  <Select
                    value={filters.yatirim_boyutu_tag}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, yatirim_boyutu_tag: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tümü</SelectItem>
                      <SelectItem value="Yerel">Yerel</SelectItem>
                      <SelectItem value="Ulusal">Ulusal</SelectItem>
                      <SelectItem value="Küresel">Küresel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-ska">SKA Etiketi</Label>
                  <Input
                    id="filter-ska"
                    placeholder="SKA filtresi"
                    value={filters.ska_tag}
                    onChange={(e) => setFilters(prev => ({ ...prev, ska_tag: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Yükleniyor...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rapor Adı</TableHead>
                      <TableHead>Hazırlanma Tarihi</TableHead>
                      <TableHead>Güncellenme Tarihi</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports?.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          <div className="max-w-md">
                            <p className="truncate">{report.yatirim_konusu}</p>
                            {report.il_tag && (
                              <Badge variant="outline" className="mt-1">
                                {report.il_tag}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.fizibilitenin_hazirlanma_tarihi
                            ? format(new Date(report.fizibilitenin_hazirlanma_tarihi), 'dd/MM/yyyy', { locale: tr })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {report.guncellenme_tarihi
                            ? format(new Date(report.guncellenme_tarihi), 'dd/MM/yyyy', { locale: tr })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(report)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClone(report)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {reports && reports.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Henüz fizibilite raporu eklenmemiş</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFeasibilityReports;
