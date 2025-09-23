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
import { Bell, Calculator, Search, Users, MapPin } from 'lucide-react';
import { useRealtimeCounters } from '@/hooks/useRealtimeCounters';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export const NotificationDropdown = () => {
  const calculationStats = useRealtimeCounters('calculation_clicks');
  const searchStats = useRealtimeCounters('search_clicks');
  
  const totalActivities = calculationStats.globalCount + searchStats.globalCount;
  const todayActivities = calculationStats.localCount + searchStats.localCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2 hover:bg-primary/5">
          <Bell className="h-4 w-4" />
          {totalActivities > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse">
                <span className="absolute inset-0 h-3 w-3 bg-red-500 rounded-full animate-ping opacity-75"></span>
                <span className="relative block h-3 w-3 bg-red-500 rounded-full"></span>
              </span>
              {totalActivities < 100 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-3 w-3 text-[8px] font-bold text-white">
                  {totalActivities > 99 ? '99+' : totalActivities}
                </span>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Canlı Aktiviteler
          </span>
          {todayActivities > 0 && (
            <Badge variant="secondary" className="text-xs">
              Bugün {todayActivities}
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Teşvik Hesaplamaları</span>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-300">
              {calculationStats.globalCount} toplam
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Destek Aramaları</span>
            </div>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {searchStats.globalCount} toplam
            </Badge>
          </div>

          <div className="pt-2 border-t text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Kullanıcı IP ve lokasyon bilgileri sistem tarafından otomatik olarak takip edilmektedir.</span>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};