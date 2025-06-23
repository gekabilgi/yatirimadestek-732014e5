
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Eye, Search, Filter, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QnaEmailLog } from '@/types/qna';

const QnaEmailLogsManagement = () => {
  const [emailLogs, setEmailLogs] = useState<QnaEmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmailType, setFilterEmailType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const fetchEmailLogs = async () => {
    try {
      let query = supabase
        .from('qna_email_logs')
        .select('*')
        .order('sent_date', { ascending: false });

      if (filterEmailType !== 'all') {
        query = query.eq('email_type', filterEmailType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('transmission_status', filterStatus);
      }

      if (dateFrom) {
        query = query.gte('sent_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('sent_date', dateTo + 'T23:59:59.999Z');
      }

      if (searchTerm) {
        query = query.or(`recipient_email.ilike.%${searchTerm}%,sender_email.ilike.%${searchTerm}%,email_subject.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast.error('E-posta logları yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchEmailLogs();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEmailType('all');
    setFilterStatus('all');
    setDateFrom('');
    setDateTo('');
    setLoading(true);
    fetchEmailLogs();
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'sent': { label: 'Gönderildi', variant: 'default' as const },
      'failed': { label: 'Başarısız', variant: 'destructive' as const },
      'pending': { label: 'Beklemede', variant: 'secondary' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getEmailTypeBadge = (type: string) => {
    const typeMap = {
      'new_question': 'Yeni Soru',
      'ydo_answer': 'YDO Cevabı',
      'admin_approval': 'Admin Onayı',
      'answer_returned': 'Cevap İadesi',
      'answer_sent': 'Cevap Gönderildi',
      'answer_corrected': 'Cevap Düzeltildi'
    };

    return typeMap[type as keyof typeof typeMap] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-posta İşlem Logları
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <div>
              <Label htmlFor="searchTerm">Arama</Label>
              <Input
                id="searchTerm"
                placeholder="E-posta, konu ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label>E-posta Türü</Label>
              <Select value={filterEmailType} onValueChange={setFilterEmailType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="new_question">Yeni Soru</SelectItem>
                  <SelectItem value="ydo_answer">YDO Cevabı</SelectItem>
                  <SelectItem value="admin_approval">Admin Onayı</SelectItem>
                  <SelectItem value="answer_returned">Cevap İadesi</SelectItem>
                  <SelectItem value="answer_sent">Cevap Gönderildi</SelectItem>
                  <SelectItem value="answer_corrected">Cevap Düzeltildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>İletim Durumu</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="sent">Gönderildi</SelectItem>
                  <SelectItem value="failed">Başarısız</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Başlangıç Tarihi</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Bitiş Tarihi</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Ara
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email Logs Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gönderilen Sayfa</TableHead>
                <TableHead>Gönderen E-posta</TableHead>
                <TableHead>Alan E-posta</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Mail Başlığı</TableHead>
                <TableHead>E-posta Türü</TableHead>
                <TableHead>İletim Durumu</TableHead>
                <TableHead>Hata Mesajı</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.sent_page}</TableCell>
                  <TableCell>{log.sender_email}</TableCell>
                  <TableCell>{log.recipient_email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(log.sent_date).toLocaleString('tr-TR')}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={log.email_subject}>
                      {log.email_subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getEmailTypeBadge(log.email_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.transmission_status)}
                  </TableCell>
                  <TableCell>
                    {log.error_message ? (
                      <div className="text-red-600 text-sm max-w-xs truncate" title={log.error_message}>
                        {log.error_message}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {emailLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              E-posta logu bulunmamaktadır.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QnaEmailLogsManagement;
