import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AnnouncementManagement } from '@/components/admin/AnnouncementManagement';
import { Megaphone } from 'lucide-react';

const AdminAnnouncements = () => {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Duyuru Yönetimi"
        description="Duyuruları yönetin ve düzenleyin"
        icon={Megaphone}
      />
      <div className="p-6">
        <AnnouncementManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
