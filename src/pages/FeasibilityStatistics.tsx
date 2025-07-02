
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, Target, MapPin, Building } from 'lucide-react';

interface FeasibilityReport {
  id: string;
  yatirim_konusu: string;
  fizibilitenin_hazirlanma_tarihi: string | null;
  guncellenme_tarihi: string | null;
  ust_sektor_tanim_tag: string | null;
  alt_sektor_tanim_tag: string | null;
  il_tag: string | null;
  yatirim_boyutu_tag: string | null;
  sabit_yatirim_tutari: number | null;
  istihdam: number | null;
  geri_odeme_suresi: number | null;
  created_at: string;
}

const FeasibilityStatistics = () => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['feasibility-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_feasibility_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FeasibilityReport[];
    },
  });

  const totalReports = reports?.length || 0;
  const totalInvestment = reports?.reduce((sum, report) => sum + (report.sabit_yatirim_tutari || 0), 0) || 0;
  const totalEmployment = reports?.reduce((sum, report) => sum + (report.istihdam || 0), 0) || 0;
  const averagePayback = reports?.length ? 
    reports.reduce((sum, report) => sum + (report.geri_odeme_suresi || 0), 0) / reports.filter(r => r.geri_odeme_suresi).length : 0;

  // Sector breakdown
  const sectorData = reports?.reduce((acc, report) => {
    const sector = report.ust_sektor_tanim_tag || 'Diğer';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sectorChartData = Object.entries(sectorData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Investment scope breakdown
  const scopeData = reports?.reduce((acc, report) => {
    const scope = report.yatirim_boyutu_tag || 'Belirtilmemiş';
    acc[scope] = (acc[scope] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scopeChartData = Object.entries(scopeData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Province breakdown (top 10)
  const provinceData = reports?.reduce((acc, report) => {
    const province = report.il_tag || 'Belirtilmemiş';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const provinceChartData = Object.entries(provinceData || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value,
    }));

  // Monthly trend
  const monthlyData = reports?.reduce((acc, report) => {
    const month = new Date(report.created_at).toLocaleString('tr-TR', { year: 'numeric', month: 'long' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.entries(monthlyData || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 12)
    .map(([name, value]) => ({
      name,
      value,
    }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6  mt-16">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fizibilite İstatistikleri</h1>
          <p className="text-gray-600">Yatırım fırsatları ve fizibilite raporları istatistikleri</p>
        </div>

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
                {totalInvestment.toLocaleString('tr-TR')} TL
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
              <div className="text-2xl font-bold">{totalEmployment}</div>
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
                <BarChart data={provinceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
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
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FeasibilityStatistics;
