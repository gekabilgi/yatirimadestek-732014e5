
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Search, Filter, RefreshCw } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const fetchEmailLogs = async () => {
    try {
      console.log('📧 Fetching email logs...');
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

      if (error) {
        console.error('❌ Error fetching email logs:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} email logs`);
      setEmailLogs(data || []);
    } catch (error) {
      console.error('❌ Error fetching email logs:', error);
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
    return <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>;
  };

  const getEmailTypeBadge = (type: string) => {
    const typeMap = {
      'new_question': 'Yeni Soru',
      'ydo_answer': 'YDO Cevabı',
      'admin_approval': 'Admin Onayı',
      'answer_returned': 'Cevap İadesi',
      'answer_sent': 'Cevap Gönderildi',
      'answer_corrected': 'Cevap Düzeltildi',
      'answer_provided': 'YDO Yanıtı'
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
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Mail className="h-5 w-5" />
              E-posta İşlem Logları
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtreler
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  fetchEmailLogs();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-6">
              <div className="lg:col-span-2">
                <Label htmlFor="searchTerm" className="text-sm">Arama</Label>
                <Input
                  id="searchTerm"
                  placeholder="E-posta, konu ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm">E-posta Türü</Label>
                <Select value={filterEmailType} onValueChange={setFilterEmailType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tür seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="new_question">Yeni Soru</SelectItem>
                    <SelectItem value="answer_provided">YDO Yanıtı</SelectItem>
                    <SelectItem value="admin_approval">Admin Onayı</SelectItem>
                    <SelectItem value="answer_returned">Cevap İadesi</SelectItem>
                    <SelectItem value="answer_sent">Cevap Gönderildi</SelectItem>
                    <SelectItem value="answer_corrected">Cevap Düzeltildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">İletim Durumu</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1">
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
                <Label htmlFor="dateFrom" className="text-sm">Başlangıç</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex flex-col">
                <Label htmlFor="dateTo" className="text-sm">Bitiş</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 mb-6">
              <Button onClick={handleSearch} className="flex-1 lg:flex-none">
                <Search className="h-4 w-4 mr-2" />
                Ara
              </Button>
              <Button variant="outline" onClick={clearFilters} className="flex-1 lg:flex-none">
                <Filter className="h-4 w-4 mr-2" />
                Temizle
              </Button>
            </div>
          </div>

          {/* Email Logs Table - Mobile Responsive */}
          <div className="overflow-hidden">
            <div className="lg:hidden space-y-4">
              {/* Mobile Card View */}
              {emailLogs.map((log) => (
                <Card key={log.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{log.email_subject}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {log.sender_email} → {log.recipient_email}
                          </p>
                        </div>
                        {getStatusBadge(log.transmission_status)}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.sent_date).toLocaleString('tr-TR')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getEmailTypeBadge(log.email_type)}
                        </Badge>
                      </div>
                      
                      <div className="text-xs">
                        <span className="font-medium">Sayfa:</span> {log.sent_page}
                      </div>
                      
                      {log.error_message && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          <strong>Hata:</strong> {log.error_message}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
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
            </div>
          </div>

          {emailLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>E-posta logu bulunmamaktadır.</p>
              <p className="text-sm mt-2">
                Sorular gönderilip yanıtlandığında e-posta logları burada görünecektir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QnaEmailLogsManagement;
