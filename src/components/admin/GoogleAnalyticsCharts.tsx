import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorldMapChart } from '@/components/charts/WorldMapChart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Eye, Globe, Activity } from 'lucide-react';

const GoogleAnalyticsCharts = () => {
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['google-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-analytics');
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-red-600">Google Analytics Bağlantı Hatası</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Google Analytics verilerine erişilemiyor. Lütfen yapılandırmanızı kontrol edin.
          </p>
          <p className="text-sm text-gray-500 mt-2">Hata: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif Kullanıcılar</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.activeUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Yeni Kullanıcılar</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.newUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Oturumlar</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.sessions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sayfa Görüntülemeleri</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.pageViews || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Page Views Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Günlük Sayfa Görüntülemeleri</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.dailyPageViews || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
  dataKey="date" 
  tickFormatter={(value) => {
    if (typeof value === 'string' && /^\d{8}$/.test(value)) {
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      return `${day}/${month}`;
    }
    return value;
  }}
/>
                <YAxis />
                <Tooltip 
  labelFormatter={(value) => {
    if (typeof value === 'string' && /^\d{8}$/.test(value)) {
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      return `${day}.${month}.${year}`;
    }
    return value;
  }}
/>
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Countries - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              En Çok Ziyaret Eden Ülkeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.topCountries?.slice(0, 8) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="country"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        
      </div>
{/* Top Countries - World Map Chart */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Ülkelere Göre Etkin Kullanıcı Sayısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorldMapChart
              data={
                (analyticsData?.topCountries || []).reduce((acc: Record<string, number>, country) => {
                  if (country.country && country.users) {
                    acc[country.country] = country.users;
                  }
                  return acc;
                }, {})
              }
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
        </div>
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Etkileşim Oranı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analyticsData?.engagementRate || '0'}%
              </div>
              <p className="text-sm text-gray-600 mt-2">Kullanıcı etkileşim oranı</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ortalama Oturum Süresi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analyticsData?.avgSessionDuration || '0'}
              </div>
              <p className="text-sm text-gray-600 mt-2">Dakika cinsinden</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geri Dönüş Oranı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analyticsData?.bounceRate || '0'}%
              </div>
              <p className="text-sm text-gray-600 mt-2">Tek sayfa ziyaretleri</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleAnalyticsCharts;
