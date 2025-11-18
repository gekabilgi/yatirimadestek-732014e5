import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calculator, Search, FileText, MessageSquare } from 'lucide-react';
import { fetchUserActivityHistory, ActivityHistory } from '@/services/userManagementService';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityHistoryCardProps {
  userId: string;
}

const ActivityHistoryCard: React.FC<ActivityHistoryCardProps> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivityHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await fetchUserActivityHistory(userId, 15);
        setActivities(data);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [userId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'calculation':
        return <Calculator className="w-4 h-4 text-blue-500" />;
      case 'search':
        return <Search className="w-4 h-4 text-green-500" />;
      case 'page_view':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'calculation':
        return 'Incentive Calculation';
      case 'search':
        return 'Search Query';
      case 'page_view':
        return 'Page Visit';
      case 'chat':
        return 'Chat Message';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your recent interactions with the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="mt-1">{getActivityIcon(activity.activity_type)}</div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {getActivityLabel(activity.activity_type)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.page_path || 'Unknown page'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityHistoryCard;
