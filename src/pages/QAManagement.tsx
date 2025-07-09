
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import QnaQuestionManagement from '@/components/admin/QnaQuestionManagement';
import QnaAdminEmailManagement from '@/components/admin/QnaAdminEmailManagement';
import QnaEmailLogsManagement from '@/components/admin/QnaEmailLogsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const QAManagement = () => {
  return (
    <AdminLayout>
       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 sm:p-8 lg:p-12 mt-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 bg-clip-text text-transparent">
                Q&A Management</h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">Manage Q&A system and admin email notifications</p>
        </div>
        
        <Tabs defaultValue="questions" className="w-full">
          <div className="px-2 lg:px-0">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
              <TabsTrigger value="questions" className="text-xs lg:text-sm">Sorular</TabsTrigger>
              <TabsTrigger value="emails" className="text-xs lg:text-sm">Admin E-postalar</TabsTrigger>
              <TabsTrigger value="email-logs" className="text-xs lg:text-sm">E-posta Logları</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="mt-4 lg:mt-6">
            <TabsContent value="questions" className="px-2 lg:px-0">
              <QnaQuestionManagement />
            </TabsContent>
            
            <TabsContent value="emails" className="px-2 lg:px-0">
              <QnaAdminEmailManagement />
            </TabsContent>
            
            <TabsContent value="email-logs" className="px-2 lg:px-0">
              <QnaEmailLogsManagement />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default QAManagement;
