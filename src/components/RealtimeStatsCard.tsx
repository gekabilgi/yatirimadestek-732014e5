import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRealtimeCounters } from '@/hooks/useRealtimeCounters';

interface RealtimeStatsCardProps {
  label: string;
  statName: string | string[];
  className?: string;
}

export const RealtimeStatsCard: React.FC<RealtimeStatsCardProps> = ({
  label,
  statName,
  className = ""
}) => {
  const { globalCount, isLoading, error } = useRealtimeCounters(statName);

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
          ) : error ? (
            <div className="flex items-center justify-center gap-2 text-red-500">
              <AlertCircle className="h-6 w-6" />
            </div>
          ) : (
            formatNumber(globalCount)
          )}
        </div>

        <div className="text-xs sm:text-sm text-gray-600 font-medium">
          {label}
        </div>
      </CardContent>
    </Card>
  );
};