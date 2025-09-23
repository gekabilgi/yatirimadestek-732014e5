import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, Eye, EyeOff, Calculator, Search, Users, MapPin, Clock } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export const NotificationDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    stats,
    markAsRead, 
    markAllAsRead 
  } = useRealtimeNotifications();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'calculation': return <Calculator className="h-4 w-4 text-green-600" />;
      case 'search': return <Search className="h-4 w-4 text-blue-600" />;
      case 'user_activity': return <Users className="h-4 w-4 text-purple-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2 hover:bg-primary/5">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse">
                <span className="absolute inset-0 h-3 w-3 bg-red-500 rounded-full animate-ping opacity-75"></span>
                <span className="relative block h-3 w-3 bg-red-500 rounded-full"></span>
              </span>
              {unreadCount < 10 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-3 w-3 text-[8px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-96 max-h-[500px] overflow-y-auto" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Canlı Bildirimler
          </span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} yeni
            </Badge>
          )}
        </DropdownMenuLabel>
        
        {/* Live Stats Section */}
        <div className="px-2 py-2 bg-gradient-to-r from-blue-50 to-purple-50 mx-2 rounded-lg mb-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-600" />
              <span className="font-medium">{stats.activeSessions}</span>
              <span className="text-gray-600">aktif</span>
            </div>
            <div className="flex items-center gap-1">
              <Calculator className="h-3 w-3 text-green-600" />
              <span className="font-medium">{stats.calculationsToday}</span>
              <span className="text-gray-600">hesaplama</span>
            </div>
            <div className="flex items-center gap-1">
              <Search className="h-3 w-3 text-purple-600" />
              <span className="font-medium">{stats.searchesToday}</span>
              <span className="text-gray-600">arama</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-orange-600" />
              <span className="font-medium">{stats.totalToday}</span>
              <span className="text-gray-600">oturum</span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {unreadCount > 0 && (
          <>
            <DropdownMenuItem onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700">
              <EyeOff className="h-3 w-3 mr-2" />
              Tümünü Okundu İşaretle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Bildirimler yükleniyor...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Henüz bildirim yok
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${
                  !notification.is_read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                        {!notification.is_read && (
                          <Eye className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    
                    {notification.data && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {notification.data.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {notification.data.location.city}
                          </span>
                        )}
                        {notification.data.ip_address && (
                          <span className="truncate">
                            IP: {notification.data.ip_address}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};