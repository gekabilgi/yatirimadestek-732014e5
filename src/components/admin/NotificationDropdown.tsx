import React, { useState, useEffect } from 'react';
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
import { Bell, Calculator, Search, Users, MapPin } from 'lucide-react';
import { useTodayActivity } from '@/hooks/useTodayActivity';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export const NotificationDropdown = () => {
  const { stats, isLoading } = useTodayActivity();
  const [viewedActivities, setViewedActivities] = useState<string[]>([]);
  
  // Load viewed activities from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('viewedNotifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setViewedActivities(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error parsing viewed notifications:', error);
        setViewedActivities([]);
      }
    }
  }, []);

  // Save viewed activities to localStorage when it changes
  useEffect(() => {
    if (viewedActivities.length > 0) {
      localStorage.setItem('viewedNotifications', JSON.stringify(viewedActivities));
    }
  }, [viewedActivities]);

  // Create a stable key for each activity to ensure consistent tracking
  const getActivityKey = (activity: any) => `${activity.id}-${activity.created_at}`;

  const unviewedCount = stats.recentActivities.filter(
    activity => !viewedActivities.includes(getActivityKey(activity))
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2 hover:bg-primary/5">
          <Bell className="h-4 w-4" />
          {unviewedCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                <span className="absolute inset-0 h-5 w-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
                <span className="relative text-[10px] font-bold text-white z-10">
                  {unviewedCount > 99 ? '99+' : unviewedCount}
                </span>
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Canlı Bildirimler
          </span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        <div className="p-3 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-600">{stats.totalToday}</span>
              <span className="text-gray-600">bugün</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-600">{stats.todayCalculations}</span>
              <span className="text-gray-600">hesaplama</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
               <Users className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-600">{stats.activeSessions}</span>
              <span className="text-gray-600">oturum</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
             <Search className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-600">{stats.todaySearches}</span>
              <span className="text-gray-600">arama</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Recent Activity */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-gray-500 py-4">
                Yükleniyor...
              </div>
            ) : stats.recentActivities.length > 0 ? (
              stats.recentActivities.slice(0, 3).map((activity) => {
                const activityKey = getActivityKey(activity);
                const isViewed = viewedActivities.includes(activityKey);
                
                const handleActivityClick = () => {
                  if (!isViewed) {
                    setViewedActivities(prev => [...prev, activityKey]);
                  }
                };

                return (
                <div 
                  key={activityKey} 
                  className={`flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-opacity ${isViewed ? 'opacity-60' : ''}`}
                  onClick={handleActivityClick}
                >
                  <div className={`w-2 h-2 rounded-full ${isViewed ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {activity.activity_type === 'calculation' ? (
                        <Calculator className="h-3 w-3 text-gray-500" />
                      ) : (
                        <Search className="h-3 w-3 text-gray-500" />
                      )}
                      <span className="text-sm font-medium">
                        {activity.activity_type === 'calculation' ? 'Yeni Hesaplama' : 'Yeni Arama'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.location_city || 'Bilinmeyen'} konumundan yeni {activity.activity_type === 'calculation' ? 'hesaplama' : 'arama'} yapıldı
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>IP: {activity.ip_address || 'Bilinmeyen'}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: tr })}
                    </div>
                  </div>
                </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-4">
                Henüz aktivite yok
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
