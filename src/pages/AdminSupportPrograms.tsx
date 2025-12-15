
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { SupportProgramsManagement } from '@/components/admin/SupportProgramsManagement';
import { Button } from '@/components/ui/button';
import { Target, Plus } from 'lucide-react';

const AdminSupportPrograms = () => {
  const [triggerCreate, setTriggerCreate] = useState(0);

  const handleCreateNew = () => {
    setTriggerCreate(prev => prev + 1);
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Destek Programları"
        description="Destek programlarını yönetin ve düzenleyin"
        icon={Target}
      >
        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Program Ekle
        </Button>
      </AdminPageHeader>
      <div className="p-6">
        <SupportProgramsManagement triggerCreate={triggerCreate} />
      </div>
    </AdminLayout>
  );
};

export default AdminSupportPrograms;
