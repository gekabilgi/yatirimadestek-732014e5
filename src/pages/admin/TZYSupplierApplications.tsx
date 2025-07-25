import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, FileText, Download, Eye, ExternalLink } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SupplierApplication {
  id: string;
  on_request_id: string;
  product_id: string;
  vergi_kimlik_no: string;
  firma_adi: string;
  iletisim_kisisi: string;
  unvan: string;
  firma_olcegi: string;
  telefon: string;
  e_posta: string;
  firma_websitesi?: string;
  il: string;
  minimum_yerlilik_orani?: number;
  tedarikci_deneyim_suresi?: number;
  notlar?: string;
  dosyalar_url?: string;
  status: string;
  created_at: string;
  products?: {
    urun_grubu_adi: string;
    pre_requests: {
      firma_adi: string;
    };
  };
}

const TZYSupplierApplications = () => {
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<SupplierApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<SupplierApplication | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_applications')
        .select(`
          *,
          products (
            urun_grubu_adi,
            pre_requests (
              firma_adi
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data || []) as SupplierApplication[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Hata',
        description: 'Başvurular yüklenirken hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.firma_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.vergi_kimlik_no.includes(searchTerm) ||
        app.iletisim_kisisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.e_posta.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('supplier_applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: 'Başarılı',
        description: 'Başvuru durumu güncellendi',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Hata',
        description: 'Durum güncellenirken hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      submitted: { label: 'Gönderildi', variant: 'outline' },
      reviewing: { label: 'İnceleniyor', variant: 'default' },
      approved: { label: 'Onaylandı', variant: 'default' },
      rejected: { label: 'Reddedildi', variant: 'destructive' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.submitted;
    return (
      <Badge variant={statusInfo.variant as any}>
        {statusInfo.label}
      </Badge>
    );
  };

  const downloadFiles = async (filesUrl: string) => {
    try {
      const filePaths = JSON.parse(filesUrl);
      
      for (const filePath of filePaths) {
        const { data } = supabase.storage
          .from('program-files')
          .getPublicUrl(filePath);
        
        if (data.publicUrl) {
          window.open(data.publicUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: 'Hata',
        description: 'Dosyalar indirilirken hata oluştu',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Tedarikçi Başvuruları
            </CardTitle>
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Firma adı, VKN, kişi adı veya e-posta ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Durum Filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="submitted">Gönderildi</SelectItem>
                  <SelectItem value="reviewing">İnceleniyor</SelectItem>
                  <SelectItem value="approved">Onaylandı</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma Bilgileri</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{application.firma_adi}</div>
                          <div className="text-sm text-gray-500">
                            VKN: {application.vergi_kimlik_no}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.firma_olcegi} Ölçek
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {application.products?.urun_grubu_adi}
                          </div>
                          <div className="text-sm text-gray-500">
                            Talep Eden: {application.products?.pre_requests?.firma_adi}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{application.iletisim_kisisi}</div>
                          <div className="text-sm text-gray-500">{application.unvan}</div>
                          <div className="text-sm text-gray-500">{application.e_posta}</div>
                          <div className="text-sm text-gray-500">{application.telefon}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={application.status}
                          onValueChange={(value) => updateApplicationStatus(application.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            {getStatusBadge(application.status)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Gönderildi</SelectItem>
                            <SelectItem value="reviewing">İnceleniyor</SelectItem>
                            <SelectItem value="approved">Onaylandı</SelectItem>
                            <SelectItem value="rejected">Reddedildi</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(application.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedApplication(application)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Başvuru Detayları</DialogTitle>
                                <DialogDescription>
                                  {selectedApplication?.firma_adi} - {selectedApplication?.products?.urun_grubu_adi}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedApplication && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Firma Bilgileri</h4>
                                      <p><strong>Firma Adı:</strong> {selectedApplication.firma_adi}</p>
                                      <p><strong>VKN:</strong> {selectedApplication.vergi_kimlik_no}</p>
                                      <p><strong>Firma Ölçeği:</strong> {selectedApplication.firma_olcegi}</p>
                                      <p><strong>İl:</strong> {selectedApplication.il}</p>
                                      {selectedApplication.firma_websitesi && (
                                        <p><strong>Website:</strong> 
                                          <a 
                                            href={selectedApplication.firma_websitesi} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline ml-1"
                                          >
                                            {selectedApplication.firma_websitesi}
                                            <ExternalLink className="inline h-3 w-3 ml-1" />
                                          </a>
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">İletişim Bilgileri</h4>
                                      <p><strong>İletişim Kişisi:</strong> {selectedApplication.iletisim_kisisi}</p>
                                      <p><strong>Unvan:</strong> {selectedApplication.unvan}</p>
                                      <p><strong>Telefon:</strong> {selectedApplication.telefon}</p>
                                      <p><strong>E-posta:</strong> {selectedApplication.e_posta}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Teknik Bilgiler</h4>
                                      {selectedApplication.minimum_yerlilik_orani && (
                                        <p><strong>Yerlilik Oranı:</strong> %{selectedApplication.minimum_yerlilik_orani}</p>
                                      )}
                                      {selectedApplication.tedarikci_deneyim_suresi && (
                                        <p><strong>Deneyim Süresi:</strong> {selectedApplication.tedarikci_deneyim_suresi} yıl</p>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Başvuru Bilgileri</h4>
                                      <p><strong>Durum:</strong> {getStatusBadge(selectedApplication.status)}</p>
                                      <p><strong>Başvuru Tarihi:</strong> {new Date(selectedApplication.created_at).toLocaleString('tr-TR')}</p>
                                    </div>
                                  </div>

                                  {selectedApplication.notlar && (
                                    <div>
                                      <h4 className="font-semibold">Notlar</h4>
                                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedApplication.notlar}</p>
                                    </div>
                                  )}

                                  {selectedApplication.dosyalar_url && (
                                    <div>
                                      <h4 className="font-semibold">Destekleyici Dosyalar</h4>
                                      <Button
                                        onClick={() => downloadFiles(selectedApplication.dosyalar_url!)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Dosyaları İndir
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {application.dosyalar_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFiles(application.dosyalar_url!)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredApplications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== 'all' ? 'Filtreye uygun başvuru bulunamadı' : 'Henüz başvuru bulunmuyor'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TZYSupplierApplications;