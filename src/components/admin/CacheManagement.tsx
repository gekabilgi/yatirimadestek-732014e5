import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Zap, 
  Clock, 
  TrendingUp,
  Hash,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CacheEntry {
  id: string;
  query_hash: string;
  normalized_query: string;
  original_query: string;
  response_text: string;
  hit_count: number;
  last_hit_at: string;
  created_at: string;
  expires_at: string;
  source: string;
}

interface CacheStats {
  total_cached_queries: number;
  total_cache_hits: number;
  avg_hits_per_query: number;
  popular_queries: number;
  expired_entries: number;
  new_today: number;
}

const CacheManagement: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch cache statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['cache-statistics'],
    queryFn: async () => {
      // Manual count since view might not work with RLS
      const { data, error } = await supabase
        .from('question_cache')
        .select('id, hit_count, created_at, expires_at');
      
      if (error) throw error;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const stats: CacheStats = {
        total_cached_queries: data?.length || 0,
        total_cache_hits: data?.reduce((sum, r) => sum + (r.hit_count || 0), 0) || 0,
        avg_hits_per_query: data?.length ? data.reduce((sum, r) => sum + (r.hit_count || 0), 0) / data.length : 0,
        popular_queries: data?.filter(r => r.hit_count > 5).length || 0,
        expired_entries: data?.filter(r => new Date(r.expires_at) < now).length || 0,
        new_today: data?.filter(r => new Date(r.created_at) >= today).length || 0
      };
      
      return stats;
    }
  });

  // Fetch top cached queries
  const { data: topQueries, isLoading: queriesLoading } = useQuery({
    queryKey: ['cache-top-queries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_cache')
        .select('*')
        .order('hit_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as CacheEntry[];
    }
  });

  // Clear expired cache entries
  const clearExpiredMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('question_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Süresi dolmuş önbellek girişleri temizlendi');
      queryClient.invalidateQueries({ queryKey: ['cache-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['cache-top-queries'] });
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Temizleme hatası: ${error.message}`);
    }
  });

  // Delete specific cache entry
  const deleteCacheMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('question_cache')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Önbellek girişi silindi');
      queryClient.invalidateQueries({ queryKey: ['cache-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['cache-top-queries'] });
    },
    onError: (error) => {
      toast.error(`Silme hatası: ${error.message}`);
    }
  });

  // Clear all cache
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('question_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tüm önbellek temizlendi');
      queryClient.invalidateQueries({ queryKey: ['cache-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['cache-top-queries'] });
    },
    onError: (error) => {
      toast.error(`Temizleme hatası: ${error.message}`);
    }
  });

  const hitRate = stats?.total_cached_queries && stats.total_cache_hits 
    ? ((stats.total_cache_hits / (stats.total_cached_queries + stats.total_cache_hits)) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Önbellek Girişleri</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.total_cached_queries || 0}</p>
                )}
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Database className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam İsabet</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.total_cache_hits || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Popüler Sorgular</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.popular_queries || 0}</p>
                )}
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Süresi Dolmuş</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-orange-500">{stats?.expired_entries || 0}</p>
                )}
              </div>
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Önbellek Yönetimi
          </CardTitle>
          <CardDescription>
            Sık sorulan sorular için önbellek ayarları ve temizleme işlemleri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => clearExpiredMutation.mutate()}
              disabled={clearExpiredMutation.isPending || !stats?.expired_entries}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Süresi Dolmuşları Temizle ({stats?.expired_entries || 0})
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Tüm önbelleği silmek istediğinizden emin misiniz?')) {
                  clearAllMutation.mutate();
                }
              }}
              disabled={clearAllMutation.isPending || !stats?.total_cached_queries}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Tümünü Temizle
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                refetchStats();
                queryClient.invalidateQueries({ queryKey: ['cache-top-queries'] });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• Önbellek süresi: 7 gün</p>
            <p>• İsabet oranı: {hitRate}%</p>
            <p>• Bugün eklenen: {stats?.new_today || 0}</p>
          </div>
        </CardContent>
      </Card>

      {/* Top Cached Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            En Çok İsabet Alan Sorgular
          </CardTitle>
          <CardDescription>
            En sık önbellekten sunulan sorgular
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queriesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : topQueries?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Henüz önbellek girişi bulunmuyor
            </p>
          ) : (
            <div className="space-y-3">
              {topQueries?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-sm truncate pr-4">
                      {entry.original_query}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {entry.query_hash.substring(0, 8)}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.created_at), 'dd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono">
                      {entry.hit_count} isabet
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCacheMutation.mutate(entry.id)}
                      disabled={deleteCacheMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheManagement;
