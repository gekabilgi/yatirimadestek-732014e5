
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, MessageSquare, TrendingUp, Eye, Clock } from 'lucide-react';

// Mock data for analytics
const pageViewsData = [
  { name: 'Pzt', views: 1200 },
  { name: 'Sal', views: 1900 },
  { name: 'Çar', views: 800 },
  { name: 'Per', views: 1600 },
  { name: 'Cum', views: 2400 },
  { name: 'Cmt', views: 2100 },
  { name: 'Paz', views: 1800 },
];

const userEngagementData = [
  { name: 'Ocak', users: 450 },
  { name: 'Şubat', users: 620 },
  { name: 'Mart', users: 580 },
  { name: 'Nisan', users: 750 },
  { name: 'Mayıs', users: 890 },
  { name: 'Haziran', users: 1200 },
];

const topPagesData = [
  { name: 'Ana Sayfa', value: 35, color: '#0088FE' },
  { name: 'Teşvik Araçları', value: 28, color: '#00C49F' },
  { name: 'Soru & Cevap', value: 18, color: '#FFBB28' },
  { name: 'Yatırımcı Sözlüğü', value: 12, color: '#FF8042' },
  { name: 'Diğer', value: 7, color: '#8884d8' },
];

export const AdminDashboard = () => {
  const stats = [
    {
      title: 'Toplam Ziyaretçi',
      value: '12,453',
      change: '+12.5%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Sayfa Görüntüleme',
      value: '45,231',
      change: '+8.2%',
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Destek Programları',
      value: '28',
      change: '+3',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Aktif Sorular',
      value: '156',
      change: '+15',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6 mt-10">
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
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
              <BarChart data={pageViewsData}>
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
              <LineChart data={userEngagementData}>
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
                  data={topPagesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {topPagesData.map((entry, index) => (
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
            <div className="space-y-4">
              {[
                { action: 'Yeni destek programı eklendi', time: '2 saat önce', type: 'create' },
                { action: 'Q&A sorusu yanıtlandı', time: '4 saat önce', type: 'update' },
                { action: 'Sözlük terimi güncellendi', time: '6 saat önce', type: 'update' },
                { action: 'Yeni kullanıcı kaydı', time: '8 saat önce', type: 'user' },
                { action: 'Email bildirimi gönderildi', time: '1 gün önce', type: 'email' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'create' ? 'bg-green-100 text-green-600' :
                    activity.type === 'update' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'user' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
