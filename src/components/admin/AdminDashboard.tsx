import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatLargeNumber, formatCurrencyCompact } from '@/utils/numberFormatting';
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
  Book,
  Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecentActivities } from './RecentActivities';
import { AdminPageHeader } from './AdminPageHeader';

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
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Sistem durumu ve hızlı erişim paneli"
        icon={Home}
      />
      
      <div className="p-6 space-y-8 animate-fade-in">

      {/* Soru & Cevap Durumu */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            Soru & Cevap Durumu
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
              <div className="text-xl font-bold text-blue-600 mb-1">{formatLargeNumber(qnaStats?.total || 0)}</div>
              <p className="text-xs font-semibold text-gray-700">Toplam Soru</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">Sistem geneli</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl">
              <div className="text-xl font-bold text-green-600 mb-1">{formatLargeNumber(qnaStats?.answered || 0)}</div>
              <p className="text-xs font-semibold text-gray-700">Cevaplanmış</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">YDO tarafından</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
              <div className="text-xl font-bold text-purple-600 mb-1">{formatLargeNumber(qnaStats?.sentToUser || 0)}</div>
              <p className="text-xs font-semibold text-gray-700 line-clamp-1">Gönderilen</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">Onaylanmış cevaplar</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl">
              <div className="text-xl font-bold text-orange-600 mb-1">{formatLargeNumber(qnaStats?.pending || 0)}</div>
              <p className="text-xs font-semibold text-gray-700">Bekleyen</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">Yanıt bekliyor</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-modern hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Fizibilite Raporları</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900 mb-1">{formatLargeNumber(feasibilityStats?.total || 0)}</div>
            <p className="text-xs text-gray-500 line-clamp-1">
              Bu ay {formatLargeNumber(feasibilityStats?.thisMonth || 0)} yeni
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
            <div className="text-xl font-bold text-gray-900 mb-1">{formatLargeNumber(supportProgramStats?.total || 0)}</div>
            <p className="text-xs text-gray-500 line-clamp-1">Aktif program</p>
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
            <div className="text-xl font-bold text-gray-900 mb-1">{formatLargeNumber(glossaryStats?.total || 0)}</div>
            <p className="text-xs text-gray-500 line-clamp-1">Tanımlanmış terim</p>
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
            <div className="text-lg font-bold text-gray-900 mb-1 break-words">
              {formatCurrencyCompact(feasibilityStats?.totalInvestment || 0)}
            </div>
            <p className="text-xs text-gray-500 line-clamp-1">
              {formatLargeNumber(feasibilityStats?.totalEmployment || 0)} kişi istihdam
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">Yatırım fizibilite raporlarını yönetin</p>
                <div className="flex flex-col gap-2 w-full">
                  <Link to="/admin/feasibility-reports" className="w-full">
                    <Button size="sm" className="btn-primary w-full">Raporları Yönet</Button>
                  </Link>
                  <Link to="/admin/feasibility-statistics" className="w-full">
                    <Button size="sm" variant="outline" className="btn-outline w-full">
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
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">Kullanıcı sorularını yönetin</p>
                <Link to="/admin/qa-management" className="block">
                  <Button size="sm" className="btn-primary w-full">Soruları Yönet</Button>
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
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">Destek programlarını düzenleyin</p>
                <Link to="/admin/support-programs" className="block">
                  <Button size="sm" className="btn-primary w-full">Programları Yönet</Button>
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
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">Terim tanımlarını yönetin</p>
                <Link to="/admin/glossary-management" className="block">
                  <Button size="sm" className="btn-primary w-full">Sözlüğü Yönet</Button>
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
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">E-posta ayarlarını düzenleyin</p>
                <Link to="/admin/email-management" className="block">
                  <Button size="sm" className="btn-primary w-full">E-postaları Yönet</Button>
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
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">Sistem analitiklerini görüntüleyin</p>
                <Link to="/admin/analytics" className="block">
                  <Button size="sm" className="btn-primary w-full">Analytics</Button>
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
    </>
  );
};

export { AdminDashboard };
