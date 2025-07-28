import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Mail, 
  TrendingUp, 
  Calendar,
  Building,
  BarChart3,
  Book
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecentActivities } from './RecentActivities';

const AdminDashboard = () => {
  const { data: qnaStats } = useQuery({
    queryKey: ['qna-stats'],
    queryFn: async () => {
      // Get total count
      const { count: total, error: totalError } = await supabase
        .from('soru_cevap')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;

      // Get answered count
      const { count: answered, error: answeredError } = await supabase
        .from('soru_cevap')
        .select('*', { count: 'exact', head: true })
        .eq('answered', true);
      
      if (answeredError) throw answeredError;

      // Get sent to user count
      const { count: sentToUser, error: sentToUserError } = await supabase
        .from('soru_cevap')
        .select('*', { count: 'exact', head: true })
        .eq('sent_to_user', true);
      
      if (sentToUserError) throw sentToUserError;

      // Get pending count
      const { count: pending, error: pendingError } = await supabase
        .from('soru_cevap')
        .select('*', { count: 'exact', head: true })
        .eq('answered', false);
      
      if (pendingError) throw pendingError;
      
      return { total, answered, sentToUser, pending };
    },
  });

  const { data: feasibilityStats } = useQuery({
    queryKey: ['feasibility-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_feasibility_reports')
        .select('sabit_yatirim_tutari, istihdam, created_at');
      
      if (error) throw error;
      
      const total = data.length;
      const totalInvestment = data.reduce((sum, report) => sum + (report.sabit_yatirim_tutari || 0), 0);
      const totalEmployment = data.reduce((sum, report) => sum + (report.istihdam || 0), 0);
      const thisMonth = data.filter(q => 
        new Date(q.created_at).getMonth() === new Date().getMonth()
      ).length;
      
      return { total, totalInvestment, totalEmployment, thisMonth };
    },
  });

  const { data: supportProgramStats } = useQuery({
    queryKey: ['support-program-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_programs')
        .select('created_at');
      
      if (error) throw error;
      
      return { total: data.length };
    },
  });

  const { data: glossaryStats } = useQuery({
    queryKey: ['glossary-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('created_at');
      
      if (error) throw error;
      
      return { total: data.length };
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-lg text-gray-600">Sistem durumu ve hızlı erişim paneli</p>
      </div>

      {/* Soru & Cevap Durumu */}
      <Card className="card-modern animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            Soru & Cevap Durumu
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-1">{qnaStats?.total || 0}</div>
              <p className="text-sm font-semibold text-gray-700">Toplam Soru</p>
              <p className="text-xs text-gray-500 mt-1">Sistem geneli</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-1">{qnaStats?.answered || 0}</div>
              <p className="text-sm font-semibold text-gray-700">Cevaplanmış</p>
              <p className="text-xs text-gray-500 mt-1">YDO tarafından</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-1">{qnaStats?.sentToUser || 0}</div>
              <p className="text-sm font-semibold text-gray-700">Sorana Gönderilen</p>
              <p className="text-xs text-gray-500 mt-1">Onaylanmış cevaplar</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl">
              <div className="text-3xl font-bold text-orange-600 mb-1">{qnaStats?.pending || 0}</div>
              <p className="text-sm font-semibold text-gray-700">Bekleyen</p>
              <p className="text-xs text-gray-500 mt-1">Yanıt bekliyor</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
        <Card className="card-modern hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Fizibilite Raporları</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">{feasibilityStats?.total || 0}</div>
            <p className="text-xs text-gray-500">
              Bu ay {feasibilityStats?.thisMonth || 0} yeni
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Destek Programları</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">{supportProgramStats?.total || 0}</div>
            <p className="text-xs text-gray-500">Aktif program</p>
          </CardContent>
        </Card>

        <Card className="card-modern hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Sözlük Terimleri</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">{glossaryStats?.total || 0}</div>
            <p className="text-xs text-gray-500">Tanımlanmış terim</p>
          </CardContent>
        </Card>

        <Card className="card-modern hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Yatırım İstatistikleri</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {feasibilityStats?.totalInvestment?.toLocaleString('tr-TR') || 0} TL
            </div>
            <p className="text-xs text-gray-500">
              {feasibilityStats?.totalEmployment || 0} kişi istihdam
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-modern hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  Fizibilite Raporları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Yatırım fizibilite raporlarını yönetin</p>
                <div className="flex gap-3">
                  <Link to="/admin/feasibility-reports">
                    <Button size="sm" className="btn-primary">Raporları Yönet</Button>
                  </Link>
                  <Link to="/admin/feasibility-statistics">
                    <Button size="sm" variant="outline" className="btn-outline">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      İstatistikler
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  Soru & Cevap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Kullanıcı sorularını yönetin</p>
                <Link to="/admin/qa-management">
                  <Button size="sm" className="btn-primary">Soruları Yönet</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-modern hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Building className="h-5 w-5 text-purple-600" />
                  </div>
                  Destek Programları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Destek programlarını düzenleyin</p>
                <Link to="/admin/support-programs">
                  <Button size="sm" className="btn-primary">Programları Yönet</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-modern hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Book className="h-5 w-5 text-orange-600" />
                  </div>
                  Yatırımcı Sözlüğü
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Terim tanımlarını yönetin</p>
                <Link to="/admin/glossary-management">
                  <Button size="sm" className="btn-primary">Sözlüğü Yönet</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-modern hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                    <Mail className="h-5 w-5 text-red-600" />
                  </div>
                  E-posta Yönetimi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">E-posta ayarlarını düzenleyin</p>
                <Link to="/admin/email-management">
                  <Button size="sm" className="btn-primary">E-postaları Yönet</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-modern hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Sistem analitiklerini görüntüleyin</p>
                <Link to="/admin/analytics">
                  <Button size="sm" className="btn-primary">Analytics</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Recent Activities */}
        <div className="lg:col-span-1">
          <RecentActivities />
        </div>
      </div>
    </div>
  );
};

export { AdminDashboard };
