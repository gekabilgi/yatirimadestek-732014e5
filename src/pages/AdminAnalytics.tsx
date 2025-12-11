import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart3, Users, FileText, TrendingUp, MessageSquare, Building, Calendar, Globe, Target, DollarSign } from 'lucide-react';
import GoogleAnalyticsCharts from '@/components/admin/GoogleAnalyticsCharts';

interface FeasibilityReport {
  id: string;
  yatirim_konusu: string;
  ust_sektor_tanim_tag: string | null;
  il_tag: string | null;
  yatirim_boyutu_tag: string | null;
  sabit_yatirim_tutari: number | null;
  istihdam: number | null;
  geri_odeme_suresi: number | null;
  created_at: string;
}

const AdminAnalytics = () => {
  const { data: qnaStats } = useQuery({
    queryKey: ['analytics-qna-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soru_cevap')
        .select('answered, created_at, province');
      
      if (error) throw error;
      
      const total = data.length;
      const answered = data.filter(q => q.answered).length;
      const unanswered = total - answered;
      
      // Monthly trend
      const monthlyData = data.reduce((acc, q) => {
        const month = new Date(q.created_at).toLocaleString('tr-TR', { year: 'numeric', month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const monthlyTrend = Object.entries(monthlyData)
        .sort(([a], [b]) => new Date(a + ' 1').getTime() - new Date(b + ' 1').getTime())
        .slice(-6)
        .map(([month, count]) => ({ month, count }));
      
      // Province breakdown
      const provinceData = data.reduce((acc, q) => {
        acc[q.province] = (acc[q.province] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topProvinces = Object.entries(provinceData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([province, count]) => ({ province, count }));
      
      return { total, answered, unanswered, monthlyTrend, topProvinces };
    },
  });

  const { data: feasibilityStats } = useQuery({
    queryKey: ['analytics-feasibility-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_feasibility_reports')
        .select('sabit_yatirim_tutari, istihdam, created_at, il_tag, ust_sektor_tanim_tag');
      
      if (error) throw error;
      
      const total = data.length;
      const totalInvestment = data.reduce((sum, report) => sum + (report.sabit_yatirim_tutari || 0), 0);
      const totalEmployment = data.reduce((sum, report) => sum + (report.istihdam || 0), 0);
      
      // Monthly trend
      const monthlyData = data.reduce((acc, report) => {
        const month = new Date(report.created_at).toLocaleString('tr-TR', { year: 'numeric', month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const monthlyTrend = Object.entries(monthlyData)
        .sort(([a], [b]) => new Date(a + ' 1').getTime() - new Date(b + ' 1').getTime())
        .slice(-6)
        .map(([month, count]) => ({ month, count }));
      
      return { total, totalInvestment, totalEmployment, monthlyTrend };
    },
  });

  // Detailed feasibility stats for the new tab
  const { data: detailedFeasibilityStats, isLoading: isFeasibilityLoading } = useQuery({
    queryKey: ['detailed-feasibility-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_feasibility_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FeasibilityReport[];
    },
  });

  const { data: supportProgramStats } = useQuery({
    queryKey: ['analytics-support-programs-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_programs')
        .select('created_at, institution_id');
      
      if (error) throw error;
      
      const total = data.length;
      const thisMonth = data.filter(p => 
        new Date(p.created_at).getMonth() === new Date().getMonth()
      ).length;
      
      return { total, thisMonth };
    },
  });

  // Feasibility calculations
  const totalReports = detailedFeasibilityStats?.length || 0;
  const totalInvestmentDetailed = detailedFeasibilityStats?.reduce((sum, report) => sum + (report.sabit_yatirim_tutari || 0), 0) || 0;
  const totalEmploymentDetailed = detailedFeasibilityStats?.reduce((sum, report) => sum + (report.istihdam || 0), 0) || 0;
  const averagePayback = detailedFeasibilityStats?.length ? 
    detailedFeasibilityStats.reduce((sum, report) => sum + (report.geri_odeme_suresi || 0), 0) / detailedFeasibilityStats.filter(r => r.geri_odeme_suresi).length : 0;

  // Sector breakdown
  const sectorData = detailedFeasibilityStats?.reduce((acc, report) => {
    const sector = report.ust_sektor_tanim_tag || 'Diğer';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sectorChartData = Object.entries(sectorData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Investment scope breakdown
  const scopeData = detailedFeasibilityStats?.reduce((acc, report) => {
    const scope = report.yatirim_boyutu_tag || 'Belirtilmemiş';
    acc[scope] = (acc[scope] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scopeChartData = Object.entries(scopeData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Province breakdown (top 10)
  const provinceDataFeasibility = detailedFeasibilityStats?.reduce((acc, report) => {
    const province = report.il_tag || 'Belirtilmemiş';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const provinceChartDataFeasibility = Object.entries(provinceDataFeasibility || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value,
    }));

  // Monthly trend for feasibility
  const monthlyDataFeasibility = detailedFeasibilityStats?.reduce((acc, report) => {
    const month = new Date(report.created_at).toLocaleString('tr-TR', { year: 'numeric', month: 'long' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartDataFeasibility = Object.entries(monthlyDataFeasibility || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 12)
    .map(([name, value]) => ({
      name,
      value,
    }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];

  const answerStatusData = [
    { name: 'Cevaplanmış', value: qnaStats?.answered || 0, color: '#82ca9d' },
    { name: 'Bekleyen', value: qnaStats?.unanswered || 0, color: '#ff7300' }
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Analytics Dashboard"
        description="Website analitikleri ve sistem performansı"
        icon={BarChart3}
      />
      
      <div className="p-6 space-y-6">

        <Tabs defaultValue="google-analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-gradient-to-r from-slate-50 to-purple-50/30 border-2 border-slate-200/50 rounded-2xl shadow-lg backdrop-blur-sm">
            <TabsTrigger 
              value="google-analytics" 
              className="relative flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-blue-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-blue-600 data-[state=inactive]:hover:bg-white/50 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md group-data-[state=active]:from-blue-600 group-data-[state=active]:to-blue-700 group-data-[state=active]:shadow-lg transition-all duration-300">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">Google Analytics</span>
                <span className="text-xs opacity-75 hidden sm:block">Web Analitikleri</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="system-analytics" 
              className="relative flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-green-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-green-600 data-[state=inactive]:hover:bg-white/50 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md group-data-[state=active]:from-green-600 group-data-[state=active]:to-green-700 group-data-[state=active]:shadow-lg transition-all duration-300">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">Sistem Analitikleri</span>
                <span className="text-xs opacity-75 hidden sm:block">Uygulama Verileri</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
            </TabsTrigger>

            <TabsTrigger 
              value="feasibility-analytics" 
              className="relative flex items-center justify-center gap-3 px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:text-orange-700 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-orange-600 data-[state=inactive]:hover:bg-white/50 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md group-data-[state=active]:from-orange-600 group-data-[state=active]:to-orange-700 group-data-[state=active]:shadow-lg transition-all duration-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">Fizibilite İstatistikleri</span>
                <span className="text-xs opacity-75 hidden sm:block">Yatırım Verileri</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300"></div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google-analytics" className="space-y-6">
            <GoogleAnalyticsCharts />
          </TabsContent>

          <TabsContent value="system-analytics" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Toplam Sorular</p>
                      <p className="text-2xl font-bold text-gray-900">{qnaStats?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Fizibilite Raporları</p>
                      <p className="text-2xl font-bold text-gray-900">{feasibilityStats?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Building className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Destek Programları</p>
                      <p className="text-2xl font-bold text-gray-900">{supportProgramStats?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Toplam Yatırım</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(feasibilityStats?.totalInvestment || 0).toLocaleString('tr-TR')} TL
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Soru & Cevap Aylık Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={qnaStats?.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cevap Durumu</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={answerStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {answerStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>En Aktif İller (Soru & Cevap)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={qnaStats?.topProvinces || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="province" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fizibilite Raporları Aylık Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={feasibilityStats?.monthlyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    İstihdam İstatistikleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Toplam İstihdam</span>
                      <span className="font-bold">{feasibilityStats?.totalEmployment || 0} kişi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ortalama/Rapor</span>
                      <span className="font-bold">
                        {feasibilityStats?.total ? Math.round((feasibilityStats.totalEmployment || 0) / feasibilityStats.total) : 0} kişi
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Bu Ay Yeni
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Destek Programları</span>
                      <span className="font-bold">{supportProgramStats?.thisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Toplam Program</span>
                      <span className="font-bold">{supportProgramStats?.total || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sistem Durumu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cevap Oranı</span>
                      <span className="font-bold">
                        {qnaStats?.total ? Math.round((qnaStats.answered / qnaStats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Aktif Modüller</span>
                      <span className="font-bold">6</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feasibility-analytics" className="space-y-6">
            {isFeasibilityLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Toplam Rapor Sayısı</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalReports}</div>
                      <p className="text-xs text-muted-foreground">Aktif fizibilite raporu</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Toplam Yatırım Tutarı</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {totalInvestmentDetailed.toLocaleString('tr-TR')} TL
                      </div>
                      <p className="text-xs text-muted-foreground">Toplam sabit yatırım</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Toplam İstihdam</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalEmploymentDetailed}</div>
                      <p className="text-xs text-muted-foreground">Kişi istihdam</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ortalama Geri Ödeme</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{averagePayback.toFixed(1)} ay</div>
                      <p className="text-xs text-muted-foreground">Ortalama süre</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sektör Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={sectorChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {sectorChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Yatırım Kapsamı</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={scopeChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#82ca9d"
                            dataKey="value"
                          >
                            {scopeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>En Çok Rapor Olan İller (Top 10)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={provinceChartDataFeasibility}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Aylık Rapor Trendi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyChartDataFeasibility}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#fb923c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;