import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Announcement } from '@/types/announcement';
import { Edit, Trash2, Plus, Search, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AnnouncementListProps {
  announcements: Announcement[];
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  announcements,
  onEdit,
  onDelete,
  onCreate,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const handleSendEmail = async (announcementId: string) => {
    setSendingEmailId(announcementId);
    try {
      const { data, error } = await supabase.functions.invoke('send-announcement-email', {
        body: { announcementId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || `${data.sent} üyeye e-posta gönderildi`);
      } else {
        toast.warning(data.message || 'E-posta gönderilemedi');
      }
    } catch (error: any) {
      console.error('Email send error:', error);
      toast.error('E-posta gönderilirken hata oluştu');
    } finally {
      setSendingEmailId(null);
    }
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.institution_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Başlık veya kurum adıyla ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Duyuru
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Kurum</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead className="w-32">Tarih</TableHead>
              <TableHead className="w-24">Durum</TableHead>
              <TableHead className="w-32 text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnnouncements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Sonuç bulunamadı' : 'Henüz duyuru eklenmemiş'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <img
                      src={announcement.institution_logo}
                      alt={announcement.institution_name}
                      className="w-10 h-10 object-contain"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{announcement.institution_name}</TableCell>
                  <TableCell>
                    <div className="max-w-md truncate">{announcement.title}</div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(announcement.announcement_date), 'd MMM yyyy', { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                      {announcement.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendEmail(announcement.id)}
                        disabled={isLoading || sendingEmailId === announcement.id}
                        title="Üyelere E-posta Gönder"
                      >
                        {sendingEmailId === announcement.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(announcement)}
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(announcement.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyuruyu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
