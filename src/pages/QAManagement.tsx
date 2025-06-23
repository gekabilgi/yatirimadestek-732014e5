
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import QnaAdminEmailManagement from '@/components/admin/QnaAdminEmailManagement';

const QAManagement = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Q&A Management</h1>
          <p className="text-gray-600 mt-2">Manage Q&A system and admin email notifications</p>
        </div>
        
        <QnaAdminEmailManagement />
      </div>
    </AdminLayout>
  );
};

export default QAManagement;
