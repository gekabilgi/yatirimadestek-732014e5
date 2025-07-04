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

// Type definitions for the new tables with correct field names
interface NaceCode {
  id: number;
  nacecode: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface GtipCode {
  id: number;
  gtipcode: string;
  description: string;
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
    kalkinmaAjanslari: [] as string[],
    yatirimTutariAraliklari: [] as string[],
    hedefUlkeler: [] as string[]
  });

  // Data queries for dropdowns - Updated to match your actual table structure
  const { data: naceData } = useQuery({
    queryKey: ['nacedortlu-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nacedortlu')
        .select('id, nacecode, description')
        .order('nacecode');
      
      if (error) {
        console.warn('NACE codes table query failed:', error);
        return [] as NaceCode[];
      }
      
      return data || [] as NaceCode[];
    }
  });

  const { data: gtipData } = useQuery({
    queryKey: ['gtipdortlu-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gtipdortlu')
        .select('id, gtipcode, description')
        .order('gtipcode');
      
      if (error) {
        console.warn('GTIP codes table query failed:', error);
        return [] as GtipCode[];
      }
      
      return data || [] as GtipCode[];
    }
  });

  // Fixed provinces query to get all Turkish provinces
  const { data: provincesData } = useQuery({
    queryKey: ['all-provinces'],
    queryFn: async () => {
      // Turkish provinces list
      const turkishProvinces = [
        'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
        'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
        'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
        'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta',
        'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
        'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
        'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
        'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
        'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman',
        'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
      ];
      
      return turkishProvinces.map(name => ({ name }));
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
      hedef_ulke_tag: formState.hedefUlkeler.join('|') || null,
      ust_sektor_tanim_tag: formState.ustSektorler.join('|') || null,
      alt_sektor_tanim_tag: formState.altSektorler.join('|') || null,
      sabit_yatirim_tutari_aralik_tag: formState.yatirimTutariAraliklari.join('|') || null,
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

  // Prepare dropdown options - Updated to use correct field names
  const naceOptions: MultiSelectOption[] = (naceData || []).map(item => ({
    label: item.nacecode,
    value: item.nacecode,
    description: item.description
  }));

  const gtipOptions: MultiSelectOption[] = (gtipData || []).map(item => ({
    label: item.gtipcode,
    value: item.gtipcode,
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

  // Updated Turkish sub-sector list
  const altSektorOptions: MultiSelectOption[] = [
    "Ağaç Ürünleri ve Mobilya İmalatı",
    "Ana Metal Sanayi",
    "Atıkların Bertarafı ve Geri Kazanım",
    "Bilgi İletişim Teknolojileri ve Optik Ürünlerin İmalatı",
    "Bilişim ve Medya Hizmetleri",
    "Bitkisel Üretim",
    "Deri ve İlgili Ürünlerin İmalatı",
    "Eğitim",
    "Elektrikli Teçhizat İmalatı",
    "Enerji Üretimi",
    "Finans, Sigorta ve Gayrimenkul",
    "Gıda Ürünleri İmalatı",
    "Hayvancılık",
    "İçeceklerin İmalatı",
    "İnşaat",
    "Kâğıt ve Kâğıt Ürünlerinin İmalatı",
    "Kauçuk ve Plastik Ürünlerin İmalatı",
    "Kimyasal Ürünlerin İmalatı",
    "Kömür ve Petrol Ürünleri İmalatı",
    "Kum, Kil, Taş ve Mineral Ocakçılığı",
    "Lojistik ve Bakım Onarım",
    "Maden Arama ve Sondaj Faaliyetleri",
    "Makine Ekipmanların Kurulum, Bakım ve Onarımı",
    "Makine ve Ekipman İmalatı",
    "Medikal Ürünleri İmalatı",
    "Metal Cevheri Madenciliği",
    "Metal Ürünleri İmalatı",
    "Ölçüm ve Test Donanımları İmalatı",
    "Organik Tarım ve Hayvancılık",
    "Ormancılık",
    "Otomotiv Sanayi",
    "Sağlık",
    "Savunma Sanayi İmalatı",
    "Seracılık",
    "Seramik ve Cam Ürünleri İmalatı",
    "Sosyo-Kültürel Faaliyetler",
    "Spor Malzemeleri ve Müzik Aletleri İmalatı",
    "Su Ürünleri",
    "Tarımsal Sanayi",
    "Taş ve Topraktan Yapı Malzemeleri İmalatı",
    "Tekstil ve Konfeksiyon Ürünlerinin İmalatı",
    "Turizm",
    "Ulaşım Araçları İmalatı",
    "Yaratıcı Endüstriler"
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

  // Investment amount ranges
  const yatirimTutariAralikOptions: MultiSelectOption[] = [
    "10.000 USD - 20.000 USD",
    "20.000 USD - 50.000 USD",
    "50.000 USD - 100.000 USD",
    "100.000 USD - 200.000 USD",
    "200.000 USD - 500.000 USD",
    "500.000 USD - 1.000.000 USD",
    "1.000.000 USD - 3.000.000 USD",
    "3.000.000 USD - 10.000.000 USD",
    "10.000.000 USD - 50.000.000 USD",
    "50.000.000 USD - 100.000.000 USD",
    ">100.000.000 USD"
  ].map(range => ({ label: range, value: range }));

  // World countries list
  const hedefUlkeOptions: MultiSelectOption[] = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
    "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
    "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia",
    "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
    "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
    "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
    "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
    "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
    "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives",
    "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
    "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
    "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea",
    "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
    "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone",
    "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka",
    "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste",
    "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
    "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ].map(country => ({ label: country, value: country }));

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
        kalkinmaAjanslari: editingReport.kalkinma_ajansi_tag?.split('|').filter(Boolean) || [],
        yatirimTutariAraliklari: editingReport.sabit_yatirim_tutari_aralik_tag?.split('|').filter(Boolean) || [],
        hedefUlkeler: editingReport.hedef_ulke_tag?.split('|').filter(Boolean) || []
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
        kalkinmaAjanslari: [],
        yatirimTutariAraliklari: [],
        hedefUlkeler: []
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

                {/* Enhanced NACE Codes Multi-Select - Now using nacedortlu table */}
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

                {/* Enhanced GTIP Codes Multi-Select - Now using gtipdortlu table */}
                <div className="md:col-span-2">
                  <Label>GTIP Kodu</Label>
                  <MultiSelect
                    options={gtipOptions}
                    selected={formState.gtipKodlari}
                    onChange={(selected) => setFormState(prev => ({ ...prev, gtipKodlari: selected }))}
                    placeholder="GTIP kodlarını seçin..."
                    searchPlaceholder="GTIP kodu ara..."
                    formatLabel={(option) => `${option.label} - ${option.description}`}
                  />
                </div>

                {/* Enhanced Province Multi-Select - Now showing all 81 Turkish provinces */}
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

                {/* Enhanced Lower Sector Multi-Select with Turkish options */}
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

                {/* New Investment Amount Range Multi-Select */}
                <div>
                  <Label>Sabit Yatırım Tutarı Aralığı</Label>
                  <MultiSelect
                    options={yatirimTutariAralikOptions}
                    selected={formState.yatirimTutariAraliklari}
                    onChange={(selected) => setFormState(prev => ({ ...prev, yatirimTutariAraliklari: selected }))}
                    placeholder="Yatırım tutarı aralığını seçin..."
                  />
                </div>

                {/* New Target Countries Multi-Select */}
                <div>
                  <Label>Hedef Ülke</Label>
                  <MultiSelect
                    options={hedefUlkeOptions}
                    selected={formState.hedefUlkeler}
                    onChange={(selected) => setFormState(prev => ({ ...prev, hedefUlkeler: selected }))}
                    placeholder="Hedef ülkeleri seçin..."
                    searchPlaceholder="Ülke ara..."
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
