
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import YdoUserManagement from '@/components/admin/YdoUserManagement';
import QnaAdminEmailManagement from '@/components/admin/QnaAdminEmailManagement';

const AdminEmailManagement = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">E-posta Yönetimi</h1>
          <p className="text-gray-600">
            YDO kullanıcıları ve admin e-postalarını yönetin. Sorular otomatik olarak ilgili il YDO kullanıcılarına ve admin e-postalarına gönderilir.
          </p>
        </div>
        
        <YdoUserManagement />
        <QnaAdminEmailManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminEmailManagement;
