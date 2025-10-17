import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, MessageSquare, User, Edit } from 'lucide-react';
import { toast } from 'sonner';
import type { UnifiedUser } from '@/services/userManagementService';
import {
  grantAdminRole,
  revokeAdminRole,
  addUserToYdo,
  removeUserFromYdo,
  addUserToQna,
  removeUserFromQna,
  updateYdoUserProvince,
} from '@/services/userManagementService';

interface UserTypeRoleManagerProps {
  user: UnifiedUser;
  onUpdate: () => void;
}

export const UserTypeRoleManager: React.FC<UserTypeRoleManagerProps> = ({ user, onUpdate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(user.user_type);
  const [selectedProvince, setSelectedProvince] = useState(user.province || '');
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (value: string) => {
    if (value === 'regular' || value === 'ydo' || value === 'qna') {
      setSelectedType(value);
    }
  };

  const userTypes = [
    { value: 'regular', label: 'Kullanıcı', icon: User },
    { value: 'ydo', label: 'YDO', icon: Users },
    { value: 'qna', label: 'QNA', icon: MessageSquare },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      // Handle admin role changes
      if (isAdmin !== user.is_admin) {
        if (!user.has_auth_account) {
          toast.error('Kullanıcının önce bir hesabı olmalıdır');
          setLoading(false);
          return;
        }
        if (isAdmin) {
          await grantAdminRole(user.auth_user_id!);
          toast.success('Admin rolü verildi');
        } else {
          await revokeAdminRole(user.auth_user_id!);
          toast.success('Admin rolü kaldırıldı');
        }
      }

      // Handle user type changes
      if (selectedType !== user.user_type) {
        // Remove from old type
        if (user.user_type === 'ydo' && user.ydo_user_id) {
          await removeUserFromYdo(user.ydo_user_id);
        } else if (user.user_type === 'qna' && user.qna_admin_id) {
          await removeUserFromQna(user.qna_admin_id);
        }

        // Add to new type
        if (selectedType === 'ydo') {
          if (!selectedProvince) {
            toast.error('YDO kullanıcıları için il seçimi zorunludur');
            setLoading(false);
            return;
          }
          await addUserToYdo(
            user.email,
            user.full_name,
            selectedProvince,
            user.auth_user_id || undefined
          );
          toast.success('Kullanıcı YDO olarak eklendi');
        } else if (selectedType === 'qna') {
          await addUserToQna(user.email, user.full_name);
          toast.success('Kullanıcı QNA admin olarak eklendi');
        }
      } else if (selectedType === 'ydo' && user.ydo_user_id && selectedProvince !== user.province) {
        // Update province if changed
        await updateYdoUserProvince(user.ydo_user_id, selectedProvince);
        toast.success('İl bilgisi güncellendi');
      }

      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Kullanıcı güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeIcon = (type: string) => {
    const userType = userTypes.find((t) => t.value === type);
    if (!userType) return null;
    const Icon = userType.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="gap-2"
      >
        <Edit className="h-4 w-4" />
        Düzenle
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcı Tipini ve Rolünü Düzenle</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Kullanıcı Bilgileri</Label>
              <div className="rounded-lg border p-3 space-y-1 bg-muted/50">
                <p className="font-medium">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={user.has_auth_account ? 'default' : 'secondary'}>
                    {user.has_auth_account ? 'Hesabı Var' : 'Hesap Yok'}
                  </Badge>
                  {user.is_admin && (
                    <Badge variant="default">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-type">Kullanıcı Tipi</Label>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger id="user-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedType === 'ydo' && (
              <div className="space-y-2">
                <Label htmlFor="province">İl *</Label>
                <Input
                  id="province"
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  placeholder="İl adı giriniz"
                />
                <p className="text-xs text-muted-foreground">
                  YDO kullanıcıları için il bilgisi zorunludur
                </p>
              </div>
            )}

            {user.has_auth_account && (
              <div className="space-y-2">
                <Label>Admin Rolü</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={isAdmin ? 'default' : 'outline'}
                    onClick={() => setIsAdmin(!isAdmin)}
                    className="flex-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Admin' : 'Admin Değil'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Admin rolü, sisteme tam erişim sağlar
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
              >
                İptal
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
