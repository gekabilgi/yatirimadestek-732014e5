import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, Search, Trash2, Mail, Loader2, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Institution {
  id: number;
  name: string;
}

interface Subscriber {
  id: string;
  ad_soyad: string;
  telefon: string | null;
  email: string;
  il: string;
  is_active: boolean;
  created_at: string;
  institutions: Institution[];
}

const AdminNewsletterSubscribers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      // Fetch subscribers with their institution preferences
      const { data: subs, error } = await supabase
        .from('bulten_uyeler')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch institution preferences for all subscribers
      const { data: preferences } = await supabase
        .from('bulten_uye_kurum_tercihleri')
        .select('uye_id, institution_id, institutions(id, name)');

      // Map preferences to subscribers
      const subsWithInstitutions = (subs || []).map(sub => {
        const subPrefs = (preferences || []).filter(p => p.uye_id === sub.id);
        return {
          ...sub,
          institutions: subPrefs.map(p => p.institutions).filter(Boolean) as Institution[]
        };
      });

      return subsWithInstitutions as Subscriber[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bulten_uyeler')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      toast.success('Üye silindi');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Silme işlemi başarısız');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('bulten_uyeler')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      toast.success('Durum güncellendi');
    },
    onError: () => {
      toast.error('Güncelleme başarısız');
    }
  });

  const filteredSubscribers = subscribers.filter(sub =>
    sub.ad_soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.il.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csvContent = [
      ['Ad Soyad', 'E-posta', 'Telefon', 'İl', 'Tercih Edilen Kurumlar', 'Durum', 'Kayıt Tarihi'].join(','),
      ...filteredSubscribers.map(sub => [
        sub.ad_soyad,
        sub.email,
        sub.telefon || '',
        sub.il,
        `"${sub.institutions.map(i => i.name).join(', ')}"`,
        sub.is_active ? 'Aktif' : 'Pasif',
        format(new Date(sub.created_at), 'dd.MM.yyyy', { locale: tr })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bulten_uyeleri_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Bülten Üyeleri"
        description="Destek bülteni abonelerini yönetin"
        icon={Users}
      />
      
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Kayıtlı Üyeler ({subscribers.length})
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Dışa Aktar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Kayıtlı üye bulunamadı
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>İl</TableHead>
                      <TableHead>Tercih Edilen Kurumlar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Kayıt Tarihi</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.ad_soyad}</TableCell>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell>{sub.telefon || '-'}</TableCell>
                        <TableCell>{sub.il}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {sub.institutions.length === 0 ? (
                              <span className="text-muted-foreground text-sm">-</span>
                            ) : (
                              sub.institutions.slice(0, 3).map((inst) => (
                                <Badge key={inst.id} variant="outline" className="text-xs">
                                  {inst.name}
                                </Badge>
                              ))
                            )}
                            {sub.institutions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{sub.institutions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={sub.is_active ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => toggleActiveMutation.mutate({ id: sub.id, is_active: !sub.is_active })}
                          >
                            {sub.is_active ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(sub.created_at), 'dd.MM.yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(sub.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Üyeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu üyeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminNewsletterSubscribers;
