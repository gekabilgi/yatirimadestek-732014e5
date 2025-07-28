import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, FileText } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<FeasibilityReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    yatirim_konusu: '',
    fizibilitenin_hazirlanma_tarihi: '',
    guncellenme_tarihi: '',
    nace_kodu_tanim: '',
    gtip_kodu_tag: '',
    hedef_ulke_tag: '',
    ust_sektor_tanim_tag: '',
    alt_sektor_tanim_tag: '',
    sabit_yatirim_tutari_aralik_tag: '',
    kalkinma_ajansi_tag: '',
    il_tag: '',
    ska_tag: '',
    yatirim_boyutu_tag: '',
    keywords_tag: '',
    sabit_yatirim_tutari: '',
    istihdam: '',
    geri_odeme_suresi: '',
    dokumanlar: '',
    link: ''
  });
  const itemsPerPage = 10;

  const queryClient = useQueryClient();

  // Fetch feasibility reports with search and pagination
  const { data: reportsData, isLoading, error } = useQuery({
    queryKey: ['admin-feasibility-reports', searchQuery, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('investment_feasibility_reports')
        .select('*', { count: 'exact' });

      if (searchQuery) {
        query = query.or(`yatirim_konusu.ilike.%${searchQuery}%,keywords_tag.ilike.%${searchQuery}%,il_tag.ilike.%${searchQuery}%`);
      }

      query = query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { reports: data || [], total: count || 0 };
    },
  });

  // Create/Update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const reportData = {
        ...data,
        sabit_yatirim_tutari: data.sabit_yatirim_tutari ? parseFloat(data.sabit_yatirim_tutari) : null,
        istihdam: data.istihdam ? parseInt(data.istihdam) : null,
        geri_odeme_suresi: data.geri_odeme_suresi ? parseFloat(data.geri_odeme_suresi) : null,
        fizibilitenin_hazirlanma_tarihi: data.fizibilitenin_hazirlanma_tarihi || null,
        guncellenme_tarihi: data.guncellenme_tarihi || null
      };

      if (data.id) {
        const { error } = await supabase
          .from('investment_feasibility_reports')
          .update(reportData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('investment_feasibility_reports')
          .insert([reportData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feasibility-reports'] });
      toast.success(editingReport ? 'Rapor güncellendi!' : 'Rapor eklendi!');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  // Delete mutation
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
      toast.success('Rapor silindi!');
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.yatirim_konusu.trim()) {
      toast.error('Yatırım konusu zorunludur!');
      return;
    }

    createUpdateMutation.mutate({
      ...formData,
      id: editingReport?.id,
    });
  };

  const handleEdit = (report: FeasibilityReport) => {
    setEditingReport(report);
    setFormData({
      yatirim_konusu: report.yatirim_konusu,
      fizibilitenin_hazirlanma_tarihi: report.fizibilitenin_hazirlanma_tarihi || '',
      guncellenme_tarihi: report.guncellenme_tarihi || '',
      nace_kodu_tanim: report.nace_kodu_tanim || '',
      gtip_kodu_tag: report.gtip_kodu_tag || '',
      hedef_ulke_tag: report.hedef_ulke_tag || '',
      ust_sektor_tanim_tag: report.ust_sektor_tanim_tag || '',
      alt_sektor_tanim_tag: report.alt_sektor_tanim_tag || '',
      sabit_yatirim_tutari_aralik_tag: report.sabit_yatirim_tutari_aralik_tag || '',
      kalkinma_ajansi_tag: report.kalkinma_ajansi_tag || '',
      il_tag: report.il_tag || '',
      ska_tag: report.ska_tag || '',
      yatirim_boyutu_tag: report.yatirim_boyutu_tag || '',
      keywords_tag: report.keywords_tag || '',
      sabit_yatirim_tutari: report.sabit_yatirim_tutari?.toString() || '',
      istihdam: report.istihdam?.toString() || '',
      geri_odeme_suresi: report.geri_odeme_suresi?.toString() || '',
      dokumanlar: report.dokumanlar || '',
      link: report.link || ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReport(null);
    setFormData({
      yatirim_konusu: '',
      fizibilitenin_hazirlanma_tarihi: '',
      guncellenme_tarihi: '',
      nace_kodu_tanim: '',
      gtip_kodu_tag: '',
      hedef_ulke_tag: '',
      ust_sektor_tanim_tag: '',
      alt_sektor_tanim_tag: '',
      sabit_yatirim_tutari_aralik_tag: '',
      kalkinma_ajansi_tag: '',
      il_tag: '',
      ska_tag: '',
      yatirim_boyutu_tag: '',
      keywords_tag: '',
      sabit_yatirim_tutari: '',
      istihdam: '',
      geri_odeme_suresi: '',
      dokumanlar: '',
      link: ''
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const totalPages = Math.ceil((reportsData?.total || 0) / itemsPerPage);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Fizibilite Raporları"
        description="Yatırım fizibilite raporlarını yönetin ve düzenleyin"
        icon={FileText}
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Rapor Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>{editingReport ? 'Rapor Düzenle' : 'Yeni Rapor Ekle'}</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="yatirim_konusu" className="text-sm font-medium">Yatırım Konusu *</Label>
                  <Input
                    id="yatirim_konusu"
                    value={formData.yatirim_konusu}
                    onChange={(e) => setFormData({ ...formData, yatirim_konusu: e.target.value })}
                    placeholder="Yatırım konusunu girin..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="fizibilitenin_hazirlanma_tarihi" className="text-sm font-medium">Hazırlanma Tarihi</Label>
                  <Input
                    id="fizibilitenin_hazirlanma_tarihi"
                    type="date"
                    value={formData.fizibilitenin_hazirlanma_tarihi}
                    onChange={(e) => setFormData({ ...formData, fizibilitenin_hazirlanma_tarihi: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="guncellenme_tarihi" className="text-sm font-medium">Güncellenme Tarihi</Label>
                  <Input
                    id="guncellenme_tarihi"
                    type="date"
                    value={formData.guncellenme_tarihi}
                    onChange={(e) => setFormData({ ...formData, guncellenme_tarihi: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="il_tag" className="text-sm font-medium">İl</Label>
                  <Input
                    id="il_tag"
                    value={formData.il_tag}
                    onChange={(e) => setFormData({ ...formData, il_tag: e.target.value })}
                    placeholder="İl adını girin..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="sabit_yatirim_tutari" className="text-sm font-medium">Sabit Yatırım Tutarı</Label>
                  <Input
                    id="sabit_yatirim_tutari"
                    type="number"
                    value={formData.sabit_yatirim_tutari}
                    onChange={(e) => setFormData({ ...formData, sabit_yatirim_tutari: e.target.value })}
                    placeholder="Tutar girin..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="istihdam" className="text-sm font-medium">İstihdam</Label>
                  <Input
                    id="istihdam"
                    type="number"
                    value={formData.istihdam}
                    onChange={(e) => setFormData({ ...formData, istihdam: e.target.value })}
                    placeholder="İstihdam sayısı..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="geri_odeme_suresi" className="text-sm font-medium">Geri Ödeme Süresi (Yıl)</Label>
                  <Input
                    id="geri_odeme_suresi"
                    type="number"
                    step="0.1"
                    value={formData.geri_odeme_suresi}
                    onChange={(e) => setFormData({ ...formData, geri_odeme_suresi: e.target.value })}
                    placeholder="Süre girin..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="link" className="text-sm font-medium">Rapor Linki</Label>
                  <Input
                    id="link"
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  İptal
                </Button>
                <Button type="submit" disabled={createUpdateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {createUpdateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>
      
      <div className="p-6 space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rapor ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fizibilite Raporları ({reportsData?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Hata: {error.message}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Yatırım Konusu</TableHead>
                        <TableHead>İl</TableHead>
                        <TableHead>Yatırım Tutarı</TableHead>
                        <TableHead>İstihdam</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsData?.reports && reportsData.reports.length > 0 ? (
                        reportsData.reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium max-w-xs">
                              <div className="truncate" title={report.yatirim_konusu}>
                                {report.yatirim_konusu}
                              </div>
                            </TableCell>
                            <TableCell>{report.il_tag || '-'}</TableCell>
                            <TableCell>
                              {report.sabit_yatirim_tutari 
                                ? `${report.sabit_yatirim_tutari.toLocaleString('tr-TR')} TL`
                                : '-'
                              }
                            </TableCell>
                            <TableCell>{report.istihdam || '-'}</TableCell>
                            <TableCell>
                              {report.created_at 
                                ? new Date(report.created_at).toLocaleDateString('tr-TR')
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
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
                                  onClick={() => handleDelete(report.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-gray-600">Hiç rapor bulunamadı.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center mt-6 border-t pt-4">
                    <Pagination>
                      <PaginationContent className="gap-1">
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-50'} h-8 px-3`}
                          />
                        </PaginationItem>
                        
                        {(() => {
                          const range = [];
                          const showEllipsis = totalPages > 7;
                          
                          if (!showEllipsis) {
                            for (let i = 1; i <= totalPages; i++) {
                              range.push(i);
                            }
                          } else {
                            range.push(1);
                            
                            if (currentPage > 4) {
                              range.push('ellipsis-start');
                            }
                            
                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPages - 1, currentPage + 1);
                            
                            for (let i = start; i <= end; i++) {
                              if (!range.includes(i)) {
                                range.push(i);
                              }
                            }
                            
                            if (currentPage < totalPages - 3) {
                              range.push('ellipsis-end');
                            }
                            
                            if (!range.includes(totalPages)) {
                              range.push(totalPages);
                            }
                          }
                          
                          return range.map((page, index) => (
                            <PaginationItem key={index}>
                              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                <PaginationEllipsis className="h-8 w-8" />
                              ) : (
                                <PaginationLink
                                  onClick={() => setCurrentPage(page as number)}
                                  isActive={currentPage === page}
                                  className={`cursor-pointer h-8 w-8 ${
                                    currentPage === page 
                                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ));
                        })()}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-50'} h-8 px-3`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFeasibilityReports;