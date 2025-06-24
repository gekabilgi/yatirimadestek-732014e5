
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

const Admin = () => {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
};

export default Admin;
