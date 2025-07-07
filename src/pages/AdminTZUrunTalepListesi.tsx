
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, Eye } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TedarikZinciriUrunTalep } from '@/types/tedarikZinciri';
import { Link } from 'react-router-dom';

const AdminTZUrunTalepListesi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productList, isLoading } = useQuery({
    queryKey: ['admin-product-list', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('tedarik_zinciri_urun_talep')
        .select(`
          *,
          tedarik_zinciri_on_talep!inner(
            firma_adi,
            firma_vergi_kimlik_no,
            firma_kisa_adi
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`urun_grubu_adi.ilike.%${searchTerm}%,tedarik_zinciri_on_talep.firma_adi.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('tedarik_zinciri_urun_talep')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-list'] });
      toast({
        title: "Başarılı",
        description: "Ürün talebi başarıyla silindi."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const { error } = await supabase
        .from('tedarik_zinciri_urun_talep')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-list'] });
      toast({
        title: "Başarılı",
        description: "Ürün durumu güncellendi."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Bu ürün talebini silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: number, isActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ürün Talep Listesi</h1>
            <p className="text-gray-600">Tüm ürün taleplerini yönetin</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Ürün adı veya firma adı ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : productList && productList.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Ürün Grubu</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Son Başvuru</TableHead>
                      <TableHead>Yerlilik</TableHead>
                      <TableHead>Deneyim</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productList.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">#{item.id}</TableCell>
                        <TableCell>{item.urun_grubu_adi}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.tedarik_zinciri_on_talep.firma_adi}</div>
                            <div className="text-sm text-gray-500">VKN: {item.tedarik_zinciri_on_talep.firma_vergi_kimlik_no}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={isExpired(item.basvuru_son_tarihi) ? 'text-red-600 font-medium' : ''}>
                            {formatDate(item.basvuru_son_tarihi)}
                          </span>
                        </TableCell>
                        <TableCell>%{item.minimum_yerlilik_orani}</TableCell>
                        <TableCell>{item.minimum_deneyim} yıl</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                            {isExpired(item.basvuru_son_tarihi) && (
                              <span className="inline-flex px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                                Süresi Dolmuş
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                            >
                              <Link to={`/admin/tzurunilanekle-${item.tedarik_zinciri_on_talep.firma_vergi_kimlik_no}/${item.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(item.id, item.is_active)}
                              disabled={toggleActiveMutation.isPending}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              disabled={deleteMutation.isPending}
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
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Arama kriterlerinize uygun ürün talebi bulunamadı'
                    : 'Henüz ürün talebi bulunmuyor'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTZUrunTalepListesi;
