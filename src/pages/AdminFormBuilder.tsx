import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import FormBuilderManager from '@/components/admin/FormBuilderManager';

const AdminFormBuilder: React.FC = () => {
  return (
    <AdminLayout>
      <FormBuilderManager />
    </AdminLayout>
  );
};

export default AdminFormBuilder;
