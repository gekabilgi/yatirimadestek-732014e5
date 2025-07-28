
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import QnaQuestionManagement from '@/components/admin/QnaQuestionManagement';
import QnaAdminEmailManagement from '@/components/admin/QnaAdminEmailManagement';
import QnaEmailLogsManagement from '@/components/admin/QnaEmailLogsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare } from 'lucide-react';

const QAManagement = () => {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Q&A Management"
        description="Manage Q&A system and admin email notifications"
        icon={MessageSquare}
      />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          
          <Tabs defaultValue="questions" className="w-full">
            <div className="mb-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
                <TabsTrigger value="questions" className="text-xs lg:text-sm">Sorular</TabsTrigger>
                <TabsTrigger value="emails" className="text-xs lg:text-sm">Admin E-postalar</TabsTrigger>
                <TabsTrigger value="email-logs" className="text-xs lg:text-sm">E-posta Logları</TabsTrigger>
              </TabsList>
            </div>
            
            <div>
              <TabsContent value="questions" className="mt-0">
                <QnaQuestionManagement />
              </TabsContent>
              
              <TabsContent value="emails" className="mt-0">
                <QnaAdminEmailManagement />
              </TabsContent>
              
              <TabsContent value="email-logs" className="mt-0">
                <QnaEmailLogsManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default QAManagement;
