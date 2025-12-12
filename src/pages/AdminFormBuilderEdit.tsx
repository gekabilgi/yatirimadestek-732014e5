import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import FormBuilderEditor from '@/components/admin/FormBuilderEditor';

const AdminFormBuilderEdit: React.FC = () => {
  return (
    <AdminLayout>
      <FormBuilderEditor />
    </AdminLayout>
  );
};

export default AdminFormBuilderEdit;
