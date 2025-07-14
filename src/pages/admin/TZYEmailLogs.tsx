import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmailLog {
  id: string;
  sender_email: string;
  recipient_email: string;
  email_subject: string;
  email_type: string;
  sent_page: string;
  sent_date: string;
  transmission_status: string;
  error_message: string | null;
  created_at: string;
}

type SortField = 'sent_date' | 'sender_email' | 'recipient_email' | 'email_subject' | 'transmission_status';
type SortDirection = 'asc' | 'desc';

const TZYEmailLogs = () => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('sent_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchEmailLogs();
  }, [sortField, sortDirection]);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('qna_email_logs')
        .select('*')
        .or('sent_page.ilike.%tzy%,sent_page.ilike.%tedarik%,email_type.ilike.%supply%,email_type.ilike.%tzy%')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast({
        title: "Hata",
        description: "E-posta logları yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredLogs = emailLogs.filter(log =>
    log.sender_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.email_subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.email_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.sent_page.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'delivered':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Mail className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'delivered':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6  mt-16">
        <div>
          <h1 className="text-3xl font-bold">Tedarik Zinciri Yerlileştirme - E-posta Logları</h1>
          <p className="text-muted-foreground">
            Tedarik zinciri yerlileştirme modülünden gönderilen tüm e-postaları görüntüleyin.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>E-posta Logları Arama</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Gönderen, alıcı, konu, tür veya sayfa ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>E-posta Logları ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="sent_date">Gönderim Tarihi</SortableHeader>
                      <SortableHeader field="sender_email">Gönderen</SortableHeader>
                      <SortableHeader field="recipient_email">Alıcı</SortableHeader>
                      <SortableHeader field="email_subject">Konu</SortableHeader>
                      <TableHead>E-posta Türü</TableHead>
                      <TableHead>Gönderildiği Sayfa</TableHead>
                      <SortableHeader field="transmission_status">Durum</SortableHeader>
                      <TableHead>Hata Mesajı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.sent_date).toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={log.sender_email}>
                          {log.sender_email}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={log.recipient_email}>
                          {log.recipient_email}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={log.email_subject}>
                          {log.email_subject}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {log.email_type}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={log.sent_page}>
                          {log.sent_page}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(log.transmission_status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.transmission_status)}`}>
                              {log.transmission_status === 'sent' ? 'Gönderildi' :
                               log.transmission_status === 'failed' ? 'Başarısız' :
                               log.transmission_status === 'delivered' ? 'Teslim Edildi' :
                               log.transmission_status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.error_message && (
                            <div className="text-red-600 text-sm truncate" title={log.error_message}>
                              {log.error_message}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Henüz e-posta logu bulunmuyor.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TZYEmailLogs;