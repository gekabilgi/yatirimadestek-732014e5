import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, ArrowUpDown, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  pre_request_id: string;
  urun_grubu_adi: string;
  urun_aciklamasi: string;
  basvuru_son_tarihi: string;
  minimum_yerlilik_orani: number;
  minimum_deneyim: number;
  firma_olcegi: string;
  status: string;
  created_at: string;
  pre_requests: {
    firma_adi: string;
    vergi_kimlik_no: string;
  };
}

type SortField = 'id' | 'urun_grubu_adi' | 'firma_adi' | 'basvuru_son_tarihi' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const TZYProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [sortField, sortDirection]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          pre_requests (
            firma_adi,
            vergi_kimlik_no
          )
        `)
        .order(sortField === 'firma_adi' ? 'pre_requests(firma_adi)' : sortField, { 
          ascending: sortDirection === 'asc' 
        });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Hata",
        description: "Ürün talepleri yüklenirken bir hata oluştu.",
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

  const handleEdit = (product: Product) => {
    navigate(`/admin/tzyue-${product.pre_requests.vergi_kimlik_no}`, { 
      state: { 
        product,
        preRequest: {
          id: product.pre_request_id,
          firma_adi: product.pre_requests.firma_adi,
          vergi_kimlik_no: product.pre_requests.vergi_kimlik_no
        }
      } 
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürün talebini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Ürün talebi başarıyla silindi.",
      });
      
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Hata",
        description: "Ürün talebi silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.urun_grubu_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.pre_requests?.firma_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.pre_requests?.vergi_kimlik_no.includes(searchTerm) ||
    product.urun_aciklamasi.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Tedarik Zinciri Yerlileştirme - Ürün Talep Listesi</h1>
            <p className="text-muted-foreground">
              Gönderilen tüm ürün taleplerini görüntüleyin ve yönetin.
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/tzyotl')}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Ürün Ekle</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ürün Talebi Arama</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün adı, firma adı, vergi kimlik no veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ürün Talepleri ({filteredProducts.length})</CardTitle>
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
                      <SortableHeader field="id">Ürün Talep ID</SortableHeader>
                      <SortableHeader field="urun_grubu_adi">Ürün/Ürün Grubu Adı</SortableHeader>
                      <SortableHeader field="firma_adi">Firma Adı</SortableHeader>
                      <TableHead>Vergi Kimlik No</TableHead>
                      <SortableHeader field="basvuru_son_tarihi">Başvuru Son Tarihi</SortableHeader>
                      <TableHead>Min. Yerlilik Oranı</TableHead>
                      <TableHead>Min. Deneyim</TableHead>
                      <TableHead>Firma Ölçeği</TableHead>
                      <SortableHeader field="status">Durum</SortableHeader>
                      <SortableHeader field="created_at">Oluşturulma Tarihi</SortableHeader>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.id.slice(0, 8)}...</TableCell>
                        <TableCell className="max-w-xs truncate" title={product.urun_grubu_adi}>
                          {product.urun_grubu_adi}
                        </TableCell>
                        <TableCell>{product.pre_requests?.firma_adi}</TableCell>
                        <TableCell>{product.pre_requests?.vergi_kimlik_no}</TableCell>
                        <TableCell>
                          {new Date(product.basvuru_son_tarihi).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>{product.minimum_yerlilik_orani}%</TableCell>
                        <TableCell>{product.minimum_deneyim} yıl</TableCell>
                        <TableCell>{product.firma_olcegi}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' :
                            product.status === 'expired' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.status === 'active' ? 'Aktif' :
                             product.status === 'expired' ? 'Süresi Doldu' : 'Pasif'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(product.created_at).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
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

export default TZYProductList;