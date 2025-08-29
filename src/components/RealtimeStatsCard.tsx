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
  const { localCount, globalCount, totalCount, isLoading, error } = useRealtimeCounters(statName);

  const formatNumber = (num: number) => {
    return num.toLocaleString('tr-TR');
  };

  return (
    <Card className={`card-elevated bg-white/80 backdrop-blur-sm border-0 hover:bg-white/90 transition-all duration-300 ${className}`}>
      <CardContent className="p-4 sm:p-6 md:p-8 text-center">
        <div className="flex flex-col gap-2">
          {/* Main counter display */}
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-lg">Yükleniyor...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 text-red-500">
                <AlertCircle className="h-6 w-6" />
                <span className="text-lg">Hata</span>
              </div>
            ) : (
              formatNumber(totalCount)
            )}
          </div>

          {/* Counter breakdown badges */}
          {!isLoading && !error && (
            <div className="flex justify-center gap-2 flex-wrap">
              {localCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-green-100 text-green-700 hover:bg-green-200"
                >
                  +{localCount} bu oturum
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className="text-xs"
              >
                {formatNumber(globalCount)} toplam
              </Badge>
            </div>
          )}
        </div>

        {/* Label */}
        <div className="text-xs sm:text-sm text-gray-600 font-medium mt-2">
          {label}
        </div>
      </CardContent>
    </Card>
  );
};