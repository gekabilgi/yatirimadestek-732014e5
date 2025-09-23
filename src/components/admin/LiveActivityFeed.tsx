import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Mail, 
  MessageSquare,
  TrendingUp
} from 'lucide-react';

export const LiveActivityFeed = () => {
  // Mock data that matches the format shown in the image
  const activities = [
    {
      id: 1,
      type: 'email',
      title: 'E-posta gönderildi: Sorunuza Yanıt Geldi - TeşvikSor',
      user: 'sadettin.tosun@...',
      role: 'Sistem',
      time: '08.09 09:09',
      icon: Mail
    },
    {
      id: 2,
      type: 'email',
      title: 'E-posta gönderildi: Sorunuza Yanıt Geldi - TeşvikSor',
      user: 'sadettin.tosun@...',
      role: 'Sistem',
      time: '08.09 09:09',
      icon: Mail
    },
    {
      id: 3,
      type: 'status_change',
      title: 'status_changed: Status changed from answered to approved',
      user: 'Sadettin Tosun',
      role: 'User',
      time: '08.09 09:09',
      icon: MessageSquare
    },
    {
      id: 4,
      type: 'status_change',
      title: 'status_changed: Status changed from unanswered to answered',
      user: 'Sadettin Tosun',
      role: 'User',
      time: '16.07 15:07',
      icon: MessageSquare
    },
    {
      id: 5,
      type: 'question',
      title: 'Yeni soru gönderildi: "Merhabalar, Kars ilinde 85.59.09 faaliye..."',
      user: '',
      role: '',
      time: '',
      icon: MessageSquare
    }
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-purple-500';
      case 'status_change': return 'text-blue-500';
      case 'question': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Sistem': return 'bg-gray-100 text-gray-700';
      case 'User': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Son Aktiviteler
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-4">
            {activities.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <IconComponent className={`h-4 w-4 ${getIconColor(activity.type)}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                      {activity.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {activity.user && (
                        <span className="text-blue-600">{activity.user}</span>
                      )}
                      {activity.role && (
                        <Badge variant="secondary" className={getRoleColor(activity.role)}>
                          {activity.role}
                        </Badge>
                      )}
                      {activity.time && (
                        <span className="ml-auto">{activity.time}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};