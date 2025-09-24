import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTodayActivity } from '@/hooks/useTodayActivity';
import { useRealtimeCounters } from '@/hooks/useRealtimeCounters';

interface RealtimeStatsCardProps {
  label: string;
  statName: string | string[];
  className?: string;
  showTotalBadge?: boolean;
}

export const RealtimeStatsCard: React.FC<RealtimeStatsCardProps> = ({
  label,
  statName,
  className = "",
  showTotalBadge = false
}) => {
  const { stats, isLoading } = useTodayActivity();
  const { globalCount, isLoading: isLoadingTotal } = useRealtimeCounters(statName);
  
  // Map statName to today's stats
  const getTodayCount = () => {
    if (Array.isArray(statName)) {
      // If multiple stats, sum them up
      return statName.reduce((sum, name) => {
        if (name === 'calculation_clicks') return sum + stats.todayCalculations;
        if (name === 'search_clicks') return sum + stats.todaySearches;
        return sum;
      }, 0);
    } else {
      // Single stat
      if (statName === 'calculation_clicks') return stats.todayCalculations;
      if (statName === 'search_clicks') return stats.todaySearches;
      return 0;
    }
  };

  const todayCount = getTodayCount();

  const formatNumber = (num: number) => {
    return num.toLocaleString('tr-TR');
  };

  return (
    <Card className={`card-elevated bg-white/80 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-300 ${className}`}>
      <CardContent className="p-4 sm:p-6 md:p-8 text-center">
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-1">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            formatNumber(todayCount)
          )}
        </div>

        <div className="text-xs sm:text-sm text-gray-600 font-medium">
          {label}
        </div>

        {showTotalBadge && (
          <div className="mt-2">
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary hover:bg-primary/20 text-xs px-2 py-1"
            >
              {isLoadingTotal ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                `Toplam: ${formatNumber(globalCount)}`
              )}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};