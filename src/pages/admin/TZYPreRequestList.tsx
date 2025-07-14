import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface PreRequest {
  id: string;
  firma_adi: string;
  unvan: string;
  vergi_kimlik_no: string;
  iletisim_kisisi: string;
  telefon: string;
  e_posta: string;
  talep_icerigi: string;
  status: string;
  created_at: string;
  on_request_id: string;
  firma_kisa_adi: string;
}

type SortField = 'id' | 'firma_adi' | 'unvan' | 'vergi_kimlik_no' | 'iletisim_kisisi' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const TZYPreRequestList = () => {
  const [preRequests, setPreRequests] = useState<PreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPreRequests();
  }, [sortField, sortDirection]);

  const fetchPreRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pre_requests')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setPreRequests(data || []);
    } catch (error) {
      console.error('Error fetching pre-requests:', error);
      toast({
        title: "Hata",
        description: "Ön talepler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (preRequest: PreRequest) => {
    navigate(`/admin/tzy-company-edit/${preRequest.vergi_kimlik_no}`, { 
      state: { preRequest } 
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ön talebi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('pre_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Ön talep başarıyla silindi.",
      });
      
      fetchPreRequests();
    } catch (error) {
      console.error('Error deleting pre-request:', error);
      toast({
        title: "Hata",
        description: "Ön talep silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredPreRequests = preRequests.filter(request =>
    request.firma_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.unvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.vergi_kimlik_no.includes(searchTerm) ||
    request.iletisim_kisisi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <AdminLayout>
      <div className="space-y-6  mt-16">
        <div>
          <h1 className="text-3xl font-bold">Tedarik Zinciri Yerlileştirme - Ön Talep Listesi</h1>
          <p className="text-muted-foreground">
            Gönderilen tüm ön talepleri görüntüleyin ve yönetin.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ön Talep Arama</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Firma adı, ünvan, vergi kimlik no veya iletişim kişisi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ön Talepler ({filteredPreRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="id">Ön Talep ID</SortableHeader>
                      <SortableHeader field="firma_adi">Firma Adı</SortableHeader>
                      <SortableHeader field="unvan">Ünvan</SortableHeader>
                      <SortableHeader field="vergi_kimlik_no">Vergi Kimlik No</SortableHeader>
                      <SortableHeader field="iletisim_kisisi">İletişim Kişisi</SortableHeader>
                      <TableHead>Telefon</TableHead>
                      <TableHead>E-posta</TableHead>
                      <SortableHeader field="status">Durum</SortableHeader>
                      <SortableHeader field="created_at">Oluşturulma Tarihi</SortableHeader>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPreRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.on_request_id || 'N/A'}</TableCell>
                        <TableCell>{request.firma_adi}</TableCell>
                        <TableCell>{request.unvan}</TableCell>
                        <TableCell>{request.vergi_kimlik_no}</TableCell>
                        <TableCell>{request.iletisim_kisisi}</TableCell>
                        <TableCell>{request.telefon}</TableCell>
                        <TableCell>{request.e_posta}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'approved' ? 'Onaylandı' :
                             request.status === 'pending' ? 'Beklemede' : 'Reddedildi'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(request)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(request.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TZYPreRequestList;