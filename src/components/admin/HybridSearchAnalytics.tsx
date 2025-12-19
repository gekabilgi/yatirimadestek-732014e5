import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Search, 
  Clock, 
  Zap, 
  Database, 
  TrendingUp,
  RefreshCw,
  Target
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AnalyticsEntry {
  id: string;
  query: string;
  query_hash: string;
  total_response_time_ms: number | null;
  cache_hit: boolean;
  qv_match_count: number;
  qv_match_type: string | null;
  vertex_has_results: boolean;
  support_match_count: number;
  response_source: string | null;
  response_length: number | null;
  query_expanded: boolean;
  created_at: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

const HybridSearchAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');

  const getDateFilter = () => {
    if (dateRange === '7d') return subDays(new Date(), 7).toISOString();
    if (dateRange === '30d') return subDays(new Date(), 30).toISOString();
    return null;
  };

  // Fetch analytics data
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['hybrid-search-analytics', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('hybrid_search_analytics')
        .select('*')
        .order('created_at', { ascending: false });
      
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      const { data, error } = await query.limit(1000);
      if (error) throw error;
      return data as AnalyticsEntry[];
    }
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!analytics?.length) return null;

    const totalQueries = analytics.length;
    const cacheHits = analytics.filter(a => a.cache_hit).length;
    const avgResponseTime = analytics
      .filter(a => a.total_response_time_ms != null)
      .reduce((sum, a) => sum + (a.total_response_time_ms || 0), 0) / 
      analytics.filter(a => a.total_response_time_ms != null).length || 0;
    
    const queryExpanded = analytics.filter(a => a.query_expanded).length;
    const vertexSuccess = analytics.filter(a => a.vertex_has_results).length;
    
    // Match type distribution
    const matchTypes: Record<string, number> = {};
    analytics.forEach(a => {
      const type = a.qv_match_type || 'none';
      matchTypes[type] = (matchTypes[type] || 0) + 1;
    });

    // Response source distribution
    const responseSources: Record<string, number> = {};
    analytics.forEach(a => {
      const source = a.response_source || 'unknown';
      responseSources[source] = (responseSources[source] || 0) + 1;
    });

    // Daily trend
    const dailyData: Record<string, { queries: number; cacheHits: number; avgTime: number[] }> = {};
    analytics.forEach(a => {
      const day = format(new Date(a.created_at), 'MM/dd');
      if (!dailyData[day]) {
        dailyData[day] = { queries: 0, cacheHits: 0, avgTime: [] };
      }
      dailyData[day].queries++;
      if (a.cache_hit) dailyData[day].cacheHits++;
      if (a.total_response_time_ms) dailyData[day].avgTime.push(a.total_response_time_ms);
    });

    const dailyTrend = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        queries: data.queries,
        cacheHits: data.cacheHits,
        avgTime: data.avgTime.length ? Math.round(data.avgTime.reduce((a, b) => a + b, 0) / data.avgTime.length) : 0
      }))
      .reverse()
      .slice(-14);

    return {
      totalQueries,
      cacheHits,
      cacheHitRate: ((cacheHits / totalQueries) * 100).toFixed(1),
      avgResponseTime: Math.round(avgResponseTime),
      queryExpanded,
      vertexSuccess,
      matchTypes: Object.entries(matchTypes).map(([name, value]) => ({ name, value })),
      responseSources: Object.entries(responseSources).map(([name, value]) => ({ name, value })),
      dailyTrend
    };
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={dateRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('7d')}
          >
            Son 7 Gün
          </Button>
          <Button
            variant={dateRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('30d')}
          >
            Son 30 Gün
          </Button>
          <Button
            variant={dateRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('all')}
          >
            Tümü
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Sorgu</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalQueries || 0}</p>
                )}
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Search className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Önbellek İsabet</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">{stats?.cacheHitRate || 0}%</p>
                )}
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ort. Yanıt Süresi</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.avgResponseTime || 0}ms</p>
                )}
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vertex Başarı</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {stats?.totalQueries ? ((stats.vertexSuccess / stats.totalQueries) * 100).toFixed(1) : 0}%
                  </p>
                )}
              </div>
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Günlük Sorgu Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.dailyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="queries" 
                    name="Toplam Sorgu"
                    stroke="#8884d8" 
                    strokeWidth={2} 
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="cacheHits" 
                    name="Önbellek İsabeti"
                    stroke="#82ca9d" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Response Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Yanıt Süresi Trendi (ms)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.dailyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgTime" name="Ort. Yanıt Süresi" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Match Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Eşleşme Türü Dağılımı
            </CardTitle>
            <CardDescription>
              Question Variants arama eşleşme türleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.matchTypes || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats?.matchTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Response Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Yanıt Kaynağı Dağılımı
            </CardTitle>
            <CardDescription>
              Yanıtların hangi kaynaklardan geldiği
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.responseSources || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#82ca9d"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats?.responseSources.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Queries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Son Sorgular</CardTitle>
          <CardDescription>En son yapılan arama sorguları</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : analytics?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Henüz analitik verisi bulunmuyor
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Sorgu</th>
                    <th className="text-left p-2 text-sm font-medium">Kaynak</th>
                    <th className="text-left p-2 text-sm font-medium">Süre</th>
                    <th className="text-left p-2 text-sm font-medium">Önbellek</th>
                    <th className="text-left p-2 text-sm font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.slice(0, 20).map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm max-w-[300px] truncate">
                        {entry.query}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.response_source || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm">
                        {entry.total_response_time_ms ? `${entry.total_response_time_ms}ms` : '-'}
                      </td>
                      <td className="p-2">
                        {entry.cache_hit ? (
                          <Badge className="bg-green-500/10 text-green-600 text-xs">HIT</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">MISS</Badge>
                        )}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {format(new Date(entry.created_at), 'dd MMM HH:mm', { locale: tr })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HybridSearchAnalytics;
