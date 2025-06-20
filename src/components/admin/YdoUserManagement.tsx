
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { YdoUser } from '@/types/qna';

const provinces = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta',
  'İçel', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
  'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman',
  'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const YdoUserManagement = () => {
  const [ydoUsers, setYdoUsers] = useState<YdoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<YdoUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    province: ''
  });

  useEffect(() => {
    fetchYdoUsers();
  }, []);

  const fetchYdoUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('ydo_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setYdoUsers(data || []);
    } catch (error) {
      console.error('Error fetching YDO users:', error);
      toast.error('YDO kullanıcıları yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.full_name || !formData.province) {
      toast.error('Tüm alanları doldurunuz.');
      return;
    }

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('ydo_users')
          .update({
            email: formData.email,
            full_name: formData.full_name,
            province: formData.province
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('YDO kullanıcısı güncellendi.');
      } else {
        const { error } = await supabase
          .from('ydo_users')
          .insert({
            email: formData.email,
            full_name: formData.full_name,
            province: formData.province
          });

        if (error) throw error;
        toast.success('YDO kullanıcısı eklendi.');
      }

      fetchYdoUsers();
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ email: '', full_name: '', province: '' });
    } catch (error) {
      console.error('Error saving YDO user:', error);
      toast.error('YDO kullanıcısı kaydedilirken hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu YDO kullanıcısını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ydo_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('YDO kullanıcısı silindi.');
      fetchYdoUsers();
    } catch (error) {
      console.error('Error deleting YDO user:', error);
      toast.error('YDO kullanıcısı silinirken hata oluştu.');
    }
  };

  const openEditDialog = (user: YdoUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      province: user.province
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData({ email: '', full_name: '', province: '' });
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
            <UserPlus className="h-5 w-5" />
            YDO Kullanıcı Yönetimi
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                YDO Kullanıcısı Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'YDO Kullanıcısını Düzenle' : 'Yeni YDO Kullanıcısı Ekle'}
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
                <div>
                  <Label htmlFor="province">İl</Label>
                  <Select value={formData.province} onValueChange={(value) => setFormData({ ...formData, province: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="İl seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Güncelle' : 'Ekle'}
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
              <TableHead>İl</TableHead>
              <TableHead>Eklenme Tarihi</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ydoUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.province}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {ydoUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz YDO kullanıcısı eklenmemiş.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default YdoUserManagement;
