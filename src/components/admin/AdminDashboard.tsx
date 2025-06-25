import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, MessageSquare, TrendingUp, Eye, Clock, UserPlus, Mail, BookOpen, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AdminDashboard = () => {
  // Fetch Google Analytics data
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
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

  const userEngagementData = React.useMemo(() => {
    if (!analyticsData?.monthlyUsers) return [];
    
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    return analyticsData.monthlyUsers.map((item: any) => {
      const year = item.month.slice(0, 4);
      const month = parseInt(item.month.slice(4, 6)) - 1;
      return {
        name: monthNames[month],
        users: item.users
      };
    });
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

  const stats = [
    {
      title: 'Toplam Ziyaretçi',
      value: analyticsData?.totalUsers || statsData?.totalUsers?.toString() || '0',
      change: '+12.5%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Sayfa Görüntüleme',
      value: analyticsData?.totalPageViews || '0',
      change: '+8.2%',
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Destek Programları',
      value: statsData?.totalPrograms?.toString() || '0',
      change: '+3',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Toplam Sorular',
      value: statsData?.totalQuestions?.toString() || '0',
      change: '+15',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isAnalyticsLoading && (index === 0 || index === 1) ? 'Yükleniyor...' : stat.value}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {stat.change}
                  </p>
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
            <CardDescription>Son 7 günün sayfa görüntüleme verileri</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pageViewsData.length > 0 ? pageViewsData : [
                { name: 'Yükleniyor...', views: 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Katılımı</CardTitle>
            <CardDescription>Aylık aktif kullanıcı sayısı</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userEngagementData.length > 0 ? userEngagementData : [
                { name: 'Yükleniyor...', users: 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pages Pie Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Popüler Sayfalar</CardTitle>
            <CardDescription>En çok ziyaret edilen sayfalar</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={topPagesData.length > 0 ? topPagesData : [
                    { name: 'Yükleniyor...', value: 100, color: '#0088FE' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => topPagesData.length > 0 ? `${name} ${value}%` : name}
                >
                  {(topPagesData.length > 0 ? topPagesData : [{ color: '#0088FE' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
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
    </div>
  );
};
