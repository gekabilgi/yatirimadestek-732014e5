
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import QnaQuestionManagement from '@/components/admin/QnaQuestionManagement';
import QnaAdminEmailManagement from '@/components/admin/QnaAdminEmailManagement';
import QnaEmailLogsManagement from '@/components/admin/QnaEmailLogsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Mail, FileText, Settings, Activity } from 'lucide-react';

const QAManagement = () => {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Q&A Management"
        description="Manage Q&A system and admin email notifications"
        icon={MessageSquare}
      />
      
      <div className="p-6">
        <Tabs defaultValue="questions" className="w-full space-y-8">
          {/* Modern Tab Navigation */}
          <div className="relative">
            <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-gradient-to-r from-slate-50 to-purple-50/30 border-2 border-slate-200/50 rounded-2xl shadow-lg backdrop-blur-sm">
              <TabsTrigger 
                value="questions" 
                className="relative flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-purple-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-purple-600 data-[state=inactive]:hover:bg-white/50 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md group-data-[state=active]:from-purple-600 group-data-[state=active]:to-purple-700 group-data-[state=active]:shadow-lg transition-all duration-300">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold">Sorular</span>
                  <span className="text-xs opacity-75">Yönetimi</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="emails" 
                className="relative flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-blue-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-blue-600 data-[state=inactive]:hover:bg-white/50 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md group-data-[state=active]:from-blue-600 group-data-[state=active]:to-blue-700 group-data-[state=active]:shadow-lg transition-all duration-300">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold">Admin E-postalar</span>
                  <span className="text-xs opacity-75">Yönetimi</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="email-logs" 
                className="relative flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-green-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-green-600 data-[state=inactive]:hover:bg-white/50 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md group-data-[state=active]:from-green-600 group-data-[state=active]:to-green-700 group-data-[state=active]:shadow-lg transition-all duration-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold">E-posta Logları</span>
                  <span className="text-xs opacity-75">İzleme</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Content with Enhanced Styling */}
          <div className="relative">
            <TabsContent value="questions" className="mt-0 space-y-6 animate-fade-in">
              <div className="relative">
                <div className="absolute -top-4 left-6 flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  <MessageSquare className="h-4 w-4" />
                  <span>Soru Yönetim Paneli</span>
                </div>
                <div className="pt-8 bg-gradient-to-br from-purple-50/50 to-white border-2 border-purple-100 rounded-2xl p-6 shadow-sm">
                  <QnaQuestionManagement />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="emails" className="mt-0 space-y-6 animate-fade-in">
              <div className="relative">
                <div className="absolute -top-4 left-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  <Settings className="h-4 w-4" />
                  <span>Admin E-posta Paneli</span>
                </div>
                <div className="pt-8 bg-gradient-to-br from-blue-50/50 to-white border-2 border-blue-100 rounded-2xl p-6 shadow-sm">
                  <QnaAdminEmailManagement />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="email-logs" className="mt-0 space-y-6 animate-fade-in">
              <div className="relative">
                <div className="absolute -top-4 left-6 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  <Activity className="h-4 w-4" />
                  <span>E-posta Log Paneli</span>
                </div>
                <div className="pt-8 bg-gradient-to-br from-green-50/50 to-white border-2 border-green-100 rounded-2xl p-6 shadow-sm">
                  <QnaEmailLogsManagement />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default QAManagement;
