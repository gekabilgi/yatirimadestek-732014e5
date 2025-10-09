import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementList } from './AnnouncementList';
import { AnnouncementForm } from './AnnouncementForm';
import { Announcement, AnnouncementFormData } from '@/types/announcement';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewState = 'list' | 'create' | 'edit';

export const AnnouncementManagement: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('display_order', { ascending: true })
        .order('announcement_date', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: AnnouncementFormData) => {
      const { error } = await supabase
        .from('announcements')
        .insert([formData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Duyuru başarıyla oluşturuldu');
      setViewState('list');
    },
    onError: (error) => {
      toast.error('Duyuru oluşturulurken hata oluştu: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: AnnouncementFormData }) => {
      const { error } = await supabase
        .from('announcements')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Duyuru başarıyla güncellendi');
      setViewState('list');
      setEditingAnnouncement(null);
    },
    onError: (error) => {
      toast.error('Duyuru güncellenirken hata oluştu: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Duyuru başarıyla silindi');
    },
    onError: (error) => {
      toast.error('Duyuru silinirken hata oluştu: ' + error.message);
    }
  });

  const handleSubmit = (formData: AnnouncementFormData) => {
    if (viewState === 'edit' && editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setViewState('edit');
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCreateNew = () => {
    setEditingAnnouncement(null);
    setViewState('create');
  };

  const handleCancel = () => {
    setEditingAnnouncement(null);
    setViewState('list');
  };

  if (viewState === 'list') {
    return (
      <AnnouncementList
        announcements={announcements}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreateNew}
        isLoading={isLoading || deleteMutation.isPending}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle>
            {viewState === 'edit' ? 'Duyuru Düzenle' : 'Yeni Duyuru Oluştur'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <AnnouncementForm
          initialData={editingAnnouncement || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};
