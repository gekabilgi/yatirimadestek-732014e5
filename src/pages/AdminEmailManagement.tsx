
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import YdoUserManagement from '@/components/admin/YdoUserManagement';
import QnaAdminEmailManagement from '@/components/admin/QnaAdminEmailManagement';
import { Mail, Users, Shield, UserCheck, Settings } from 'lucide-react';

const AdminEmailManagement = () => {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="E-posta Yönetimi"
        description="YDO kullanıcıları ve admin e-postalarını yönetin. Sorular otomatik olarak ilgili il YDO kullanıcılarına ve admin e-postalarına gönderilir."
        icon={Mail}
      />
      
      <div className="p-6">
        <Tabs defaultValue="ydo-users" className="w-full space-y-8">
          {/* Modern Tab Navigation */}
          <div className="relative">
            <TabsList className="grid w-full grid-cols-2 h-auto p-2 bg-gradient-to-r from-slate-50 to-blue-50/30 border-2 border-slate-200/50 rounded-2xl shadow-lg backdrop-blur-sm">
              <TabsTrigger 
                value="ydo-users" 
                className="relative flex items-center justify-center gap-3 px-6 py-4 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-blue-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-blue-600 data-[state=inactive]:hover:bg-white/50 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md group-data-[state=active]:from-blue-600 group-data-[state=active]:to-blue-700 group-data-[state=active]:shadow-lg transition-all duration-300">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold">YDO Kullanıcı</span>
                  <span className="text-xs opacity-75">Yönetimi</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="admin-emails" 
                className="relative flex items-center justify-center gap-3 px-6 py-4 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-green-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-green-600 data-[state=inactive]:hover:bg-white/50 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md group-data-[state=active]:from-green-600 group-data-[state=active]:to-green-700 group-data-[state=active]:shadow-lg transition-all duration-300">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold">Admin E-posta</span>
                  <span className="text-xs opacity-75">Yönetimi</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Content with Enhanced Styling */}
          <div className="relative">
            <TabsContent value="ydo-users" className="mt-0 space-y-6 animate-fade-in">
              <div className="relative">
                <div className="absolute -top-4 left-6 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  <UserCheck className="h-4 w-4" />
                  <span>YDO Kullanıcı Paneli</span>
                </div>
                <div className="pt-8 bg-gradient-to-br from-blue-50/50 to-white border-2 border-blue-100 rounded-2xl p-6 shadow-sm">
                  <YdoUserManagement />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="admin-emails" className="mt-0 space-y-6 animate-fade-in">
              <div className="relative">
                <div className="absolute -top-4 left-6 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  <Settings className="h-4 w-4" />
                  <span>Admin E-posta Paneli</span>
                </div>
                <div className="pt-8 bg-gradient-to-br from-green-50/50 to-white border-2 border-green-100 rounded-2xl p-6 shadow-sm">
                  <QnaAdminEmailManagement />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailManagement;
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
