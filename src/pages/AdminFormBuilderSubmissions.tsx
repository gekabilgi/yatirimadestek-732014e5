import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import FormSubmissionViewer from '@/components/admin/FormSubmissionViewer';

const AdminFormBuilderSubmissions: React.FC = () => {
  return (
    <AdminLayout>
      <FormSubmissionViewer />
    </AdminLayout>
  );
};

export default AdminFormBuilderSubmissions;
