
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import YdoUserManagement from '@/components/admin/YdoUserManagement';
import QnaAdminEmailManagement from '@/components/admin/QnaAdminEmailManagement';
import { Mail } from 'lucide-react';

const AdminEmailManagement = () => {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="E-posta Yönetimi"
        description="YDO kullanıcıları ve admin e-postalarını yönetin. Sorular otomatik olarak ilgili il YDO kullanıcılarına ve admin e-postalarına gönderilir."
        icon={Mail}
      />
      
      <div className="p-6 space-y-6">
        
        <YdoUserManagement />
        <QnaAdminEmailManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminEmailManagement;
