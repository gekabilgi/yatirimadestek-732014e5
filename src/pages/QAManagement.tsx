
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import QnaQuestionManagement from '@/components/admin/QnaQuestionManagement';
import QnaAdminEmailManagement from '@/components/admin/QnaAdminEmailManagement';
import QnaEmailLogsManagement from '@/components/admin/QnaEmailLogsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const QAManagement = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Q&A Management</h1>
          <p className="text-gray-600 mt-2">Manage Q&A system and admin email notifications</p>
        </div>
        
        <Tabs defaultValue="questions" className="w-full">
          <TabsList>
            <TabsTrigger value="questions">Sorular</TabsTrigger>
            <TabsTrigger value="emails">Admin E-postalar</TabsTrigger>
            <TabsTrigger value="email-logs">E-posta Logları</TabsTrigger>
          </TabsList>
          
          <TabsContent value="questions">
            <QnaQuestionManagement />
          </TabsContent>
          
          <TabsContent value="emails">
            <QnaAdminEmailManagement />
          </TabsContent>
          
          <TabsContent value="email-logs">
            <QnaEmailLogsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default QAManagement;
