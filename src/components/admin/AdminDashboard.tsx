import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, MessageSquare, TrendingUp, Eye, Clock, UserPlus, Mail, BookOpen, Activity, MousePointer, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// World map component using SVG
const WorldMap = ({ data }: { data: any[] }) => {
  const getCountryColor = (countryCode: string) => {
    const country = data.find(d => d.countryCode === countryCode);
    if (!country) return '#f0f0f0';
    
    const maxUsers = Math.max(...data.map(d => d.users));
    const intensity = country.users / maxUsers;
    
    // Color intensity based on user count
    if (intensity > 0.8) return '#1e40af'; // Dark blue
    if (intensity > 0.6) return '#3b82f6'; // Blue
    if (intensity > 0.4) return '#60a5fa'; // Light blue
    if (intensity > 0.2) return '#93c5fd'; // Lighter blue
    return '#dbeafe'; // Very light blue
  };

  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <div className="relative w-full max-w-4xl">
        <svg viewBox="0 0 1000 500" className="w-full h-full">
          {/* Simplified world map paths - major countries */}
          {/* Turkey */}
          <path
            d="M540 180 L580 180 L590 190 L580 200 L540 200 Z"
            fill={getCountryColor('TR')}
            stroke="#333"
            strokeWidth="0.5"
            className="hover:opacity-80 cursor-pointer"
          />
          
          {/* USA */}
          <path
            d="M150 200 L300 200 L300 280 L150 280 Z"
            fill={getCountryColor('US')}
            stroke="#333"
            strokeWidth="0.5"
            className="hover:opacity-80 cursor-pointer"
          />
          
          {/* Spain */}
          <path
            d="M420 220 L480 220 L480 260 L420 260 Z"
            fill={getCountryColor('ES')}
            stroke="#333"
            strokeWidth="0.5"
            className="hover:opacity-80 cursor-pointer"
          />
          
          {/* Singapore */}
          <path
            d="M780 320 L790 320 L790 330 L780 330 Z"
            fill={getCountryColor('SG')}
            stroke="#333"
            strokeWidth="0.5"
            className="hover:opacity-80 cursor-pointer"
          />
        </svg>
        
        {/* Legend */}
        <div className="mt-4 flex justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Veri yok</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Az</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Orta</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Çok</span>
          </div>
        </div>
        
        {/* Country list */}
        <div className="mt-4 space-y-2">
          {data.map((country, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: getCountryColor(country.countryCode) }}
                ></div>
                <span>{country.country}</span>
              </span>
              <span className="font-medium">{country.users}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  // Fetch Google Analytics data
  const { data: analyticsData, isLoading: isAnalyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['google-analytics'],
    queryFn: async () => {
      console.log('Fetching Google Analytics data...');
      const { data, error } = await supabase.functions.invoke('google-analytics');
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  // Fetch real activities from the database
  const { data: activitiesData } = useQuery({
    queryKey: ['admin-dashboard-activities'],
    queryFn: async () => {
      console.log('Fetching dashboard activities...');

      // Get recent activities from various sources
      const [
        supportPrograms,
        qnaActivities,
        glossaryTerms,
        emailLogs,
        profiles
      ] = await Promise.all([
        // Recent support programs
        supabase
          .from('support_programs')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5),

        // Recent Q&A audit trail
        supabase
          .from('qna_audit_trail')
          .select('action, created_at, user_role, notes')
          .order('created_at', { ascending: false })
          .limit(10),

        // Recent glossary terms
        supabase
          .from('glossary_terms')
          .select('term, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(5),

        // Recent email logs
        supabase
          .from('qna_email_logs')
          .select('email_type, sent_date, transmission_status')
          .order('sent_date', { ascending: false })
          .limit(5),

        // Recent user registrations
        supabase
          .from('profiles')
          .select('email, created_at, role')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Combine and format all activities
      const activities = [];

      // Add support program activities
      if (supportPrograms.data) {
        supportPrograms.data.forEach(program => {
          activities.push({
            action: 'Yeni destek programı eklendi',
            detail: program.title,
            time: program.created_at,
            type: 'create',
            icon: FileText
          });
        });
      }

      // Add Q&A activities
      if (qnaActivities.data) {
        qnaActivities.data.forEach(activity => {
          let actionText = 'Q&A aktivitesi';
          let type = 'update';
          
          switch (activity.action) {
            case 'submitted':
              actionText = 'Yeni soru gönderildi';
              type = 'create';
              break;
            case 'answered':
              actionText = 'Soru yanıtlandı';
              type = 'update';
              break;
            case 'status_changed':
              actionText = 'Soru durumu güncellendi';
              type = 'update';
              break;
            case 'approved':
              actionText = 'Cevap onaylandı';
              type = 'update';
              break;
          }

          activities.push({
            action: actionText,
            detail: activity.notes || `${activity.user_role} tarafından`,
            time: activity.created_at,
            type,
            icon: MessageSquare
          });
        });
      }

      // Add glossary activities
      if (glossaryTerms.data) {
        glossaryTerms.data.forEach(term => {
          const isNew = new Date(term.created_at).getTime() === new Date(term.updated_at).getTime();
          activities.push({
            action: isNew ? 'Yeni sözlük terimi eklendi' : 'Sözlük terimi güncellendi',
            detail: term.term,
            time: term.updated_at,
            type: isNew ? 'create' : 'update',
            icon: BookOpen
          });
        });
      }

      // Add email activities
      if (emailLogs.data) {
        emailLogs.data.forEach(log => {
          let actionText = 'Email gönderildi';
          if (log.transmission_status === 'failed') {
            actionText = 'Email gönderimi başarısız';
          }

          activities.push({
            action: actionText,
            detail: log.email_type,
            time: log.sent_date,
            type: 'email',
            icon: Mail
          });
        });
      }

      // Add user registration activities
      if (profiles.data) {
        profiles.data.forEach(profile => {
          activities.push({
            action: 'Yeni kullanıcı kaydı',
            detail: profile.email,
            time: profile.created_at,
            type: 'user',
            icon: UserPlus
          });
        });
      }

      // Sort all activities by time
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      return activities.slice(0, 10); // Return latest 10 activities
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      console.log('Fetching dashboard stats...');

      const [
        supportProgramsCount,
        totalQuestions,
        glossaryCount,
        profilesCount
      ] = await Promise.all([
        supabase
          .from('support_programs')
          .select('id', { count: 'exact', head: true }),
        
        supabase
          .from('soru_cevap')
          .select('id', { count: 'exact', head: true }),
        
        supabase
          .from('glossary_terms')
          .select('id', { count: 'exact', head: true }),
        
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
      ]);

      return {
        totalPrograms: supportProgramsCount.count || 0,
        totalQuestions: totalQuestions.count || 0,
        glossaryTerms: glossaryCount.count || 0,
        totalUsers: profilesCount.count || 0
      };
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Format engagement rate as percentage
  const formatEngagementRate = (rate: string) => {
    const numericRate = parseFloat(rate);
    if (isNaN(numericRate)) return '0%';
    return `${(numericRate * 100).toFixed(1)}%`;
  };

  // Process analytics data for charts
  const pageViewsData = React.useMemo(() => {
    if (!analyticsData?.dailyPageViews) return [];
    
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    return analyticsData.dailyPageViews.map((item: any) => {
      const date = new Date(item.date.slice(0,4), item.date.slice(4,6)-1, item.date.slice(6,8));
      return {
        name: dayNames[date.getDay()],
        views: item.views
      };
    });
  }, [analyticsData]);

  // Process analytics data for country visualization
  const countryData = React.useMemo(() => {
    if (!analyticsData?.topCountries) return [];
    
    return analyticsData.topCountries.map((country: any) => ({
      country: country.country,
      countryCode: country.countryCode,
      users: country.users
    }));
  }, [analyticsData]);

  const topPagesData = React.useMemo(() => {
    if (!analyticsData?.topPages) return [];
    
    const total = analyticsData.topPages.reduce((sum: number, page: any) => sum + page.views, 0);
    
    return analyticsData.topPages.map((page: any, index: number) => ({
      name: page.title.length > 20 ? page.title.substring(0, 20) + '...' : page.title,
      value: Math.round((page.views / total) * 100),
      color: COLORS[index % COLORS.length]
    }));
  }, [analyticsData]);

  // Google Analytics stat cards
  const gaStats = [
    {
      title: 'Aktif Kullanıcılar',
      subtitle: 'Şu anda',
      value: analyticsData?.activeUsers || '0',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      loading: isAnalyticsLoading,
    },
    {
      title: 'Yeni Kullanıcılar',
      subtitle: 'Son 7 gün',
      value: analyticsData?.newUsers || '0',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      loading: isAnalyticsLoading,
    },
    {
      title: 'Oturumlar',
      subtitle: 'Son 7 gün',
      value: analyticsData?.sessions || '0',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      loading: isAnalyticsLoading,
    },
    {
      title: 'Sayfa Görüntüleme',
      subtitle: 'Son 7 gün',
      value: analyticsData?.pageViews || '0',
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      loading: isAnalyticsLoading,
    },
    {
      title: 'Etkileşim Oranı',
      subtitle: 'Son 7 gün',
      value: formatEngagementRate(analyticsData?.engagementRate || '0'),
      icon: MousePointer,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      loading: isAnalyticsLoading,
    },
  ];

  // Database stats
  const dbStats = [
    {
      title: 'Destek Programları',
      subtitle: 'Toplam',
      value: statsData?.totalPrograms?.toString() || '0',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      loading: false,
    },
    {
      title: 'Toplam Sorular',
      subtitle: 'Q&A sisteminde',
      value: statsData?.totalQuestions?.toString() || '0',
      icon: MessageSquare,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      loading: false,
    },
    {
      title: 'Sözlük Terimleri',
      subtitle: 'Toplam',
      value: statsData?.glossaryTerms?.toString() || '0',
      icon: BookOpen,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      loading: false,
    },
  ];

  const allStats = [...gaStats, ...dbStats];

  const formatTimeAgo = (timeString: string) => {
    const now = new Date();
    const time = new Date(timeString);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} gün önce`;
  };

  return (
    <div className="space-y-6 mt-16">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Admin panel ana sayfası ve analitik veriler</p>
        {analyticsError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">Google Analytics verileri yüklenirken hata oluştu: {analyticsError.message}</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {allStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-xs text-gray-500 mb-2">{stat.subtitle}</p>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Haftalık Sayfa Görüntüleme</CardTitle>
            <CardDescription>Son 7 günün sayfa görüntüleme verileri (Google Analytics)</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pageViewsData.length > 0 ? pageViewsData : [
                  { name: 'Veri yok', views: 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* World Map for Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Ülkelere Göre Kullanıcılar</span>
            </CardTitle>
            <CardDescription>Kullanıcıların bulunduğu ülkeler (Son 7 gün)</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyticsLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            ) : (
              <WorldMap data={countryData.length > 0 ? countryData : [
                { country: 'Veri yok', countryCode: 'XX', users: 0 }
              ]} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
          <CardDescription>Sistem üzerindeki son işlemler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {activitiesData && activitiesData.length > 0 ? (
              activitiesData.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'create' ? 'bg-green-100 text-green-600' :
                    activity.type === 'update' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'user' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.detail}</p>
                    <p className="text-xs text-gray-400">{formatTimeAgo(activity.time)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Henüz aktivite bulunmuyor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
