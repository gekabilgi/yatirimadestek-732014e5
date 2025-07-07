
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TedarikZinciriOnTalep } from '@/types/tedarikZinciri';
import { Link } from 'react-router-dom';

const AdminTZOnTalepListesi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: onTalepList, isLoading } = useQuery({
    queryKey: ['admin-on-talep-list', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('tedarik_zinciri_on_talep')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`firma_adi.ilike.%${searchTerm}%,iletisim_kisi.ilike.%${searchTerm}%,firma_vergi_kimlik_no.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TedarikZinciriOnTalep[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('tedarik_zinciri_on_talep')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-on-talep-list'] });
      toast({
        title: "Başarılı",
        description: "Ön talep başarıyla silindi."
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
    if (window.confirm('Bu ön talebi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ön Talep Listesi</h1>
            <p className="text-gray-600">Tedarik zinciri yerlileştirme ön taleplerini yönetin</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Firma adı, yetkili veya VKN ile ara..."
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
            ) : onTalepList && onTalepList.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Yetkili</TableHead>
                      <TableHead>Unvan</TableHead>
                      <TableHead>VKN</TableHead>
                      <TableHead>Talep</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onTalepList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">#{item.id}</TableCell>
                        <TableCell>{item.firma_adi}</TableCell>
                        <TableCell>{item.iletisim_kisi}</TableCell>
                        <TableCell>{item.unvan || '-'}</TableCell>
                        <TableCell>{item.firma_vergi_kimlik_no}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.talep_icerigi}
                        </TableCell>
                        <TableCell>{formatDate(item.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                            >
                              <Link to={`/admin/tzontalepduzenle-${item.firma_vergi_kimlik_no}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
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
                    ? 'Arama kriterlerinize uygun ön talep bulunamadı'
                    : 'Henüz ön talep bulunmuyor'
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

export default AdminTZOnTalepListesi;
