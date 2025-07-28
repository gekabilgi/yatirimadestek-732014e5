
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      
      <div className="p-6">
        <Tabs defaultValue="ydo-users" className="w-full">
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-none lg:flex">
              <TabsTrigger value="ydo-users" className="text-sm">YDO Kullanıcı Yönetimi</TabsTrigger>
              <TabsTrigger value="admin-emails" className="text-sm">Admin E-posta Yönetimi</TabsTrigger>
            </TabsList>
          </div>
          
          <div>
            <TabsContent value="ydo-users" className="mt-0">
              <YdoUserManagement />
            </TabsContent>
            
            <TabsContent value="admin-emails" className="mt-0">
              <QnaAdminEmailManagement />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailManagement;
