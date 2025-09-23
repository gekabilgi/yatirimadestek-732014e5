import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Calculator, 
  Search, 
  Eye, 
  MapPin, 
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export const LiveActivityFeed = () => {
  const { notifications, stats, isLoading } = useRealtimeNotifications();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'calculation': return <Calculator className="h-4 w-4 text-green-600" />;
      case 'search': return <Search className="h-4 w-4 text-blue-600" />;
      case 'user_activity': return <Users className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: tr 
      });
    } catch {
      return 'Az önce';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-green-600" />
          Canlı Aktivite
          <Badge variant="outline" className="ml-auto">
            {stats.activeSessions} aktif oturum
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Live Stats Summary */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <Calculator className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-700">{stats.calculationsToday}</div>
              <div className="text-xs text-green-600">Hesaplama</div>
            </div>
            
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Search className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-700">{stats.searchesToday}</div>
              <div className="text-xs text-blue-600">Arama</div>
            </div>
            
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-700">{stats.totalToday}</div>
              <div className="text-xs text-purple-600">Oturum</div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="border-t">
          <ScrollArea className="h-96">
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                  <p>Aktiviteler yükleniyor...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz aktivite yok</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-sm ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(notification.created_at)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        {notification.data && (
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {notification.data.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {notification.data.location.city}, {notification.data.location.country}
                              </span>
                            )}
                            
                            {notification.data.ip_address && (
                              <span className="font-mono">
                                {notification.data.ip_address}
                              </span>
                            )}
                            
                            {notification.data.page_path && (
                              <span className="truncate">
                                {notification.data.page_path}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};