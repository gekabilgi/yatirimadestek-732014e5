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
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecentActivities } from './RecentActivities';

const AdminDashboard = () => {
  const { data: qnaStats } = useQuery({
    queryKey: ['qna-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soru_cevap')
        .select('answered, sent_to_user, created_at');
      
      if (error) throw error;
      
      const total = data.length;
      const answered = data.filter(q => q.answered).length;
      const sentToUser = data.filter(q => q.sent_to_user).length;
      const pending = data.filter(q => !q.answered).length;
      
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
    <div className="space-y-6 mt-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Sistem durumu ve hızlı erişim</p>
      </div>

      {/* Soru & Cevap Durumu */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Soru & Cevap Durumu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sorular</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qnaStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Sistem geneli</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cevaplanmış</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qnaStats?.answered || 0}</div>
            <p className="text-xs text-muted-foreground">YDO tarafından</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorana Gönderilen</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qnaStats?.sentToUser || 0}</div>
            <p className="text-xs text-muted-foreground">Onaylanmış cevaplar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qnaStats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Yanıt bekliyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fizibilite Raporları</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feasibilityStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Bu ay {feasibilityStats?.thisMonth || 0} yeni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destek Programları</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportProgramStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Aktif program</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sözlük Terimleri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{glossaryStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Tanımlanmış terim</p>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Investment Stats and Q&A Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Investment Stats and Q&A Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Yatırım İstatistikleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Toplam Yatırım Tutarı</span>
                    <span className="font-bold">
                      {feasibilityStats?.totalInvestment?.toLocaleString('tr-TR') || 0} TL
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Toplam İstihdam</span>
                    <span className="font-bold">{feasibilityStats?.totalEmployment || 0} kişi</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fizibilite Raporları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Yatırım fizibilite raporlarını yönetin</p>
                <div className="flex gap-2">
                  <Link to="/admin/feasibility-reports">
                    <Button size="sm">Raporları Yönet</Button>
                  </Link>
                  <Link to="/admin/feasibility-statistics">
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      İstatistikler
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Soru & Cevap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Kullanıcı sorularını yönetin</p>
                <Link to="/admin/qa-management">
                  <Button size="sm">Soruları Yönet</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Destek Programları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Destek programlarını düzenleyin</p>
                <Link to="/admin/support-programs">
                  <Button size="sm">Programları Yönet</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yatırımcı Sözlüğü</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Terim tanımlarını yönetin</p>
                <Link to="/admin/glossary-management">
                  <Button size="sm">Sözlüğü Yönet</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">E-posta Yönetimi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">E-posta ayarlarını düzenleyin</p>
                <Link to="/admin/email-management">
                  <Button size="sm">E-postaları Yönet</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Sistem analitiklerini görüntüleyin</p>
                <Link to="/admin/analytics">
                  <Button size="sm">Analytics</Button>
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
