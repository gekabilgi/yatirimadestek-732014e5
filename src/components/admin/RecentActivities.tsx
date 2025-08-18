
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { truncateText } from '@/utils/numberFormatting';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Mail, 
  Plus, 
  Book, 
  FileText, 
  Users,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'question_submitted' | 'question_answered' | 'email_sent' | 'program_added' | 'glossary_added' | 'report_added';
  description: string;
  user_name?: string;
  user_role?: string;
  timestamp: string;
  metadata?: any;
}

const RecentActivities = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const activities: ActivityItem[] = [];

      // Get recent Q&A activities
      const { data: qnaData } = await supabase
        .from('qna_audit_trail')
        .select(`
          id,
          action,
          created_at,
          user_role,
          notes,
          soru_cevap:soru_cevap_id (
            full_name,
            question
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (qnaData) {
        qnaData.forEach(item => {
          let type: ActivityItem['type'] = 'question_submitted';
          let description = '';
          
          switch (item.action) {
            case 'submitted':
              type = 'question_submitted';
              description = `Yeni soru gönderildi: "${truncateText((item.soru_cevap as any)?.question || '', 40)}"`;
              break;
            case 'answered':
              type = 'question_answered';
              description = `Soru yanıtlandı: "${truncateText((item.soru_cevap as any)?.question || '', 40)}"`;
              break;
            default:
              description = `${item.action}: ${item.notes || 'Detay yok'}`;
          }

          activities.push({
            id: item.id,
            type,
            description,
            user_name: (item.soru_cevap as any)?.full_name,
            user_role: item.user_role || 'user',
            timestamp: item.created_at,
          });
        });
      }

      // Get recent email activities
      const { data: emailData } = await supabase
        .from('qna_email_logs')
        .select('id, email_type, recipient_email, sent_date, email_subject')
        .order('sent_date', { ascending: false })
        .limit(10);

      if (emailData) {
        emailData.forEach(item => {
          activities.push({
            id: item.id,
            type: 'email_sent',
            description: `E-posta gönderildi: ${truncateText(item.email_subject || '', 40)}`,
            user_name: truncateText(item.recipient_email || '', 20),
            user_role: 'system',
            timestamp: item.sent_date,
          });
        });
      }

      // Get recent support programs
      const { data: programData } = await supabase
        .from('support_programs')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (programData) {
        programData.forEach(item => {
          activities.push({
            id: item.id,
            type: 'program_added',
            description: `Yeni destek programı: ${truncateText(item.title || '', 35)}`,
            user_role: 'admin',
            timestamp: item.created_at,
          });
        });
      }

      // Get recent glossary terms
      const { data: glossaryData } = await supabase
        .from('glossary_terms')
        .select('id, term, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (glossaryData) {
        glossaryData.forEach(item => {
          activities.push({
            id: item.id,
            type: 'glossary_added',
            description: `Yeni sözlük terimi: ${truncateText(item.term || '', 35)}`,
            user_role: 'admin',
            timestamp: item.created_at,
          });
        });
      }

      // Get recent feasibility reports
      const { data: reportData } = await supabase
        .from('investment_feasibility_reports')
        .select('id, yatirim_konusu, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (reportData) {
        reportData.forEach(item => {
          activities.push({
            id: item.id,
            type: 'report_added',
            description: `Yeni fizibilite raporu: ${truncateText(item.yatirim_konusu || '', 35)}`,
            user_role: 'admin',
            timestamp: item.created_at,
          });
        });
      }

      // Sort all activities by timestamp
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
    },
  });

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'question_submitted':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'question_answered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'email_sent':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'program_added':
        return <Plus className="h-4 w-4 text-orange-500" />;
      case 'glossary_added':
        return <Book className="h-4 w-4 text-indigo-500" />;
      case 'report_added':
        return <FileText className="h-4 w-4 text-teal-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'ydo':
        return 'bg-blue-100 text-blue-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Son Aktiviteler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Son Aktiviteler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
          {activities?.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-gray-900 font-medium line-clamp-2 leading-tight">
                  {activity.description}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {activity.user_name && (
                    <span className="text-xs text-gray-600 truncate max-w-[100px]">
                      {activity.user_name}
                    </span>
                  )}
                  
                  <Badge 
                    variant="secondary" 
                    className={`text-xs py-0 px-1 ${getRoleBadgeColor(activity.user_role || 'user')}`}
                  >
                    {activity.user_role === 'admin' ? 'Admin' : 
                     activity.user_role === 'ydo' ? 'YDO' :
                     activity.user_role === 'system' ? 'Sistem' : 'User'}
                  </Badge>
                  
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(activity.timestamp), 'dd.MM HH:mm')}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {(!activities || activities.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Henüz aktivite bulunmuyor</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { RecentActivities };
