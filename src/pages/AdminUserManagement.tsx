import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Shield, UserPlus, Search, Key, Link as LinkIcon, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAllUsersWithRoles,
  grantAdminRole,
  revokeAdminRole,
  linkYdoUserToAuth,
  createAuthAccountForUser,
  toggleQnaAdminStatus,
  checkIfUserExists,
  type UnifiedUser,
} from '@/services/userManagementService';

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
  const [isLinkAccountDialogOpen, setIsLinkAccountDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsersWithRoles();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAdminRole = async (user: UnifiedUser) => {
    if (!user.has_auth_account) {
      toast.error('Kullanıcının önce bir hesabı olmalıdır');
      return;
    }

    try {
      await grantAdminRole(user.auth_user_id!);
      toast.success('Admin rolü verildi');
      loadUsers();
    } catch (error) {
      console.error('Error granting admin role:', error);
      toast.error('Admin rolü verilirken hata oluştu');
    }
  };

  const handleRevokeAdminRole = async (user: UnifiedUser) => {
    if (!confirm('Admin rolünü kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await revokeAdminRole(user.auth_user_id!);
      toast.success('Admin rolü kaldırıldı');
      loadUsers();
    } catch (error) {
      console.error('Error revoking admin role:', error);
      toast.error('Admin rolü kaldırılırken hata oluştu');
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('Şifre girmeniz gerekiyor');
      return;
    }

    try {
      const result = await createAuthAccountForUser(
        selectedUser.email,
        newPassword,
        selectedUser.full_name
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Link YDO user if applicable
      if (selectedUser.ydo_user_id) {
        await linkYdoUserToAuth(selectedUser.ydo_user_id, result.userId);
      }

      toast.success('Hesap başarıyla oluşturuldu');
      setIsCreateAccountDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Hesap oluşturulurken hata oluştu');
    }
  };

  const handleLinkAccount = async () => {
    if (!selectedUser || !searchEmail) {
      toast.error('E-posta adresi girmeniz gerekiyor');
      return;
    }

    try {
      const { exists, userId } = await checkIfUserExists(searchEmail);

      if (!exists) {
        toast.error('Bu e-posta ile kayıtlı kullanıcı bulunamadı');
        return;
      }

      if (selectedUser.ydo_user_id) {
        await linkYdoUserToAuth(selectedUser.ydo_user_id, userId!);
        toast.success('Hesap başarıyla bağlandı');
        setIsLinkAccountDialogOpen(false);
        setSearchEmail('');
        setSelectedUser(null);
        loadUsers();
      }
    } catch (error) {
      console.error('Error linking account:', error);
      toast.error('Hesap bağlanırken hata oluştu');
    }
  };

  const handleToggleQnaStatus = async (user: UnifiedUser) => {
    if (!user.qna_admin_id) return;

    try {
      await toggleQnaAdminStatus(user.qna_admin_id, !user.is_active);
      toast.success(`QNA admin ${!user.is_active ? 'aktif' : 'pasif'} hale getirildi`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling QNA admin status:', error);
      toast.error('Durum değiştirilirken hata oluştu');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'no-auth' && !user.has_auth_account) ||
      (filterType === 'admin' && user.is_admin) ||
      (filterType === 'ydo' && user.user_type === 'ydo') ||
      (filterType === 'qna' && user.user_type === 'qna');

    return matchesSearch && matchesType;
  });

  const getUserTypeBadge = (user: UnifiedUser) => {
    const variants: Record<string, any> = {
      admin: 'default',
      ydo: 'secondary',
      qna: 'outline',
      regular: 'outline',
    };

    const labels: Record<string, string> = {
      admin: 'Admin',
      ydo: 'YDO',
      qna: 'QNA',
      regular: 'Kullanıcı',
    };

    return (
      <Badge variant={variants[user.user_type]}>
        {labels[user.user_type]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Kullanıcı ve Rol Yönetimi"
        description="Tüm kullanıcıları görüntüleyin ve rol atamalarını yönetin"
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <Users className="h-4 w-4 mr-2" />
            Tüm Kullanıcılar ({users.length})
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Rol Yönetimi
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="no-auth">Hesabı Olmayanlar</SelectItem>
              <SelectItem value="admin">Adminler</SelectItem>
              <SelectItem value="ydo">YDO Kullanıcıları</SelectItem>
              <SelectItem value="qna">QNA Adminler</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Kullanıcı Tipi</TableHead>
                    <TableHead>Hesap Durumu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İl</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getUserTypeBadge(user)}</TableCell>
                      <TableCell>
                        <Badge variant={user.has_auth_account ? 'default' : 'secondary'}>
                          {user.has_auth_account ? 'Hesabı Var' : 'Hesap Yok'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.province || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!user.has_auth_account && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsCreateAccountDialogOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              {user.user_type === 'ydo' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsLinkAccountDialogOpen(true);
                                  }}
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {user.has_auth_account && !user.is_admin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGrantAdminRole(user)}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Admin Yap
                            </Button>
                          )}
                          {user.is_admin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevokeAdminRole(user)}
                            >
                              Rolü Kaldır
                            </Button>
                          )}
                          {user.user_type === 'qna' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleQnaStatus(user)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Kullanıcı bulunamadı
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adminler</p>
                    <p className="text-2xl font-bold">{users.filter((u) => u.is_admin).length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">YDO Kullanıcıları</p>
                    <p className="text-2xl font-bold">{users.filter((u) => u.user_type === 'ydo').length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hesabı Olmayanlar</p>
                    <p className="text-2xl font-bold">{users.filter((u) => !u.has_auth_account).length}</p>
                  </div>
                  <UserPlus className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Account Dialog */}
      <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Hesap Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>E-posta</Label>
              <Input value={selectedUser?.email || ''} disabled />
            </div>
            <div>
              <Label>Ad Soyad</Label>
              <Input value={selectedUser?.full_name || ''} disabled />
            </div>
            <div>
              <Label>Şifre</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Şifre giriniz"
                />
                <Button type="button" onClick={generatePassword} variant="outline">
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateAccountDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateAccount}>Hesap Oluştur</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Account Dialog */}
      <Dialog open={isLinkAccountDialogOpen} onOpenChange={setIsLinkAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mevcut Hesaba Bağla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>YDO Kullanıcısı</Label>
              <Input value={selectedUser?.email || ''} disabled />
            </div>
            <div>
              <Label>Bağlanacak Hesap E-postası</Label>
              <Input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Mevcut hesabın e-postası"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLinkAccountDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleLinkAccount}>Hesap Bağla</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUserManagement;
