
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { SupportProgramsManagement } from '@/components/admin/SupportProgramsManagement';
import { Target } from 'lucide-react';

const AdminSupportPrograms = () => {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Destek Programları"
        description="Destek programlarını yönetin ve düzenleyin"
        icon={Target}
      />
      <div className="p-6">
        <SupportProgramsManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminSupportPrograms;
