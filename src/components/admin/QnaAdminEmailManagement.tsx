import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QnaAdminEmail } from '@/types/qna';

const QnaAdminEmailManagement = () => {
  const [adminEmails, setAdminEmails] = useState<QnaAdminEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<QnaAdminEmail | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    is_active: true
  });

  useEffect(() => {
    fetchAdminEmails();
  }, []);

  const fetchAdminEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('qna_admin_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminEmails(data || []);
    } catch (error) {
      console.error('Error fetching admin emails:', error);
      toast.error('Admin e-postaları yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.full_name) {
      toast.error('E-posta ve ad soyad alanları zorunludur.');
      return;
    }

    try {
      if (editingEmail) {
        const { error } = await supabase
          .from('qna_admin_emails')
          .update({
            email: formData.email,
            full_name: formData.full_name,
            is_active: formData.is_active
          })
          .eq('id', editingEmail.id);

        if (error) throw error;
        toast.success('Admin e-postası güncellendi.');
      } else {
        const { error } = await supabase
          .from('qna_admin_emails')
          .insert({
            email: formData.email,
            full_name: formData.full_name,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success('Admin e-postası eklendi.');
      }

      fetchAdminEmails();
      setIsDialogOpen(false);
      setEditingEmail(null);
      setFormData({ email: '', full_name: '', is_active: true });
    } catch (error) {
      console.error('Error saving admin email:', error);
      toast.error('Admin e-postası kaydedilirken hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu admin e-postasını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('qna_admin_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Admin e-postası silindi.');
      fetchAdminEmails();
    } catch (error) {
      console.error('Error deleting admin email:', error);
      toast.error('Admin e-postası silinirken hata oluştu.');
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('qna_admin_emails')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Durum güncellendi.');
      fetchAdminEmails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Durum güncellenirken hata oluştu.');
    }
  };

  const openEditDialog = (adminEmail: QnaAdminEmail) => {
    setEditingEmail(adminEmail);
    setFormData({
      email: adminEmail.email,
      full_name: adminEmail.full_name,
      is_active: adminEmail.is_active
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingEmail(null);
    setFormData({ email: '', full_name: '', is_active: true });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin E-posta Yönetimi
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Admin E-postası Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEmail ? 'Admin E-postasını Düzenle' : 'Yeni Admin E-postası Ekle'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="E-posta adresini giriniz"
                  />
                </div>
                <div>
                  <Label htmlFor="full_name">Ad Soyad</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Ad ve soyadını giriniz"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit">
                    {editingEmail ? 'Güncelle' : 'Ekle'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Eklenme Tarihi</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminEmails.map((adminEmail) => (
              <TableRow key={adminEmail.id}>
                <TableCell className="font-medium">{adminEmail.full_name}</TableCell>
                <TableCell>{adminEmail.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={adminEmail.is_active ? "default" : "secondary"}>
                      {adminEmail.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                    <Switch
                      checked={adminEmail.is_active}
                      onCheckedChange={() => toggleActiveStatus(adminEmail.id, adminEmail.is_active)}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(adminEmail.created_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(adminEmail)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(adminEmail.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {adminEmails.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz admin e-postası eklenmemiş.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QnaAdminEmailManagement;
