
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const reportData = {
      yatirim_konusu: formData.get('yatirim_konusu') as string,
      fizibilitenin_hazirlanma_tarihi: formData.get('fizibilitenin_hazirlanma_tarihi') as string || null,
      guncellenme_tarihi: formData.get('guncellenme_tarihi') as string || null,
      nace_kodu_tanim: formData.get('nace_kodu_tanim') as string || null,
      gtip_kodu_tag: formData.get('gtip_kodu_tag') as string || null,
      hedef_ulke_tag: formData.get('hedef_ulke_tag') as string || null,
      ust_sektor_tanim_tag: formData.get('ust_sektor_tanim_tag') as string || null,
      alt_sektor_tanim_tag: formData.get('alt_sektor_tanim_tag') as string || null,
      sabit_yatirim_tutari_aralik_tag: formData.get('sabit_yatirim_tutari_aralik_tag') as string || null,
      kalkinma_ajansi_tag: formData.get('kalkinma_ajansi_tag') as string || null,
      il_tag: formData.get('il_tag') as string || null,
      ska_tag: formData.get('ska_tag') as string || null,
      yatirim_boyutu_tag: formData.get('yatirim_boyutu_tag') as string || null,
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

  return (
    <AdminLayout>
      <div className="space-y-6">
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
                    <div>
                      <Label htmlFor="nace_kodu_tanim">NACE Kodu Tanımı</Label>
                      <Input
                        id="nace_kodu_tanim"
                        name="nace_kodu_tanim"
                        defaultValue={editingReport?.nace_kodu_tanim || ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="il_tag">İl</Label>
                      <Input
                        id="il_tag"
                        name="il_tag"
                        defaultValue={editingReport?.il_tag || ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="yatirim_boyutu_tag">Yatırım Boyutu</Label>
                      <Select name="yatirim_boyutu_tag" defaultValue={editingReport?.yatirim_boyutu_tag || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yerel">Yerel</SelectItem>
                          <SelectItem value="Ulusal">Ulusal</SelectItem>
                          <SelectItem value="Küresel">Küresel</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Label htmlFor="ska_tag">SKA Etiketleri (| ile ayırın)</Label>
                      <Input
                        id="ska_tag"
                        name="ska_tag"
                        defaultValue={editingReport?.ska_tag || ''}
                        placeholder="8-İnsana Yakışır İş ve Ekonomik Büyüme|9-Sanayi, İnovasyon ve Altyapı"
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
                      <Label htmlFor="gtip_kodu_tag">GTIP Kodu</Label>
                      <Input
                        id="gtip_kodu_tag"
                        name="gtip_kodu_tag"
                        defaultValue={editingReport?.gtip_kodu_tag || ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ust_sektor_tanim_tag">Üst Sektör</Label>
                      <Input
                        id="ust_sektor_tanim_tag"
                        name="ust_sektor_tanim_tag"
                        defaultValue={editingReport?.ust_sektor_tanim_tag || ''}
                      />
                    </div>
                    <div>
                      <Label htmlFor="alt_sektor_tanim_tag">Alt Sektör</Label>
                      <Input
                        id="alt_sektor_tanim_tag"
                        name="alt_sektor_tanim_tag"
                        defaultValue={editingReport?.alt_sektor_tanim_tag || ''}
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
                    <div>
                      <Label htmlFor="kalkinma_ajansi_tag">Kalkınma Ajansı</Label>
                      <Input
                        id="kalkinma_ajansi_tag"
                        name="kalkinma_ajansi_tag"
                        defaultValue={editingReport?.kalkinma_ajansi_tag || ''}
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
