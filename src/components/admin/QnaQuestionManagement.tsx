import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MessageSquare, Calendar, User, MapPin, CheckCircle, XCircle, ArrowLeft, Send, Search, Upload, Download, FileSpreadsheet, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Question } from '@/types/qna';
import { MultiSelect } from '@/components/ui/multi-select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as XLSX from 'xlsx';

const QnaQuestionManagement = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerStatus, setAnswerStatus] = useState<string>('answered');
  const [returnReason, setReturnReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = [
    { label: 'Ar-Ge ve Tasarım', value: 'ar-ge-ve-tasarim' },
    { label: 'Bilişim', value: 'bilisim' },
    { label: 'Dış Ticaret', value: 'dis-ticaret' },
    { label: 'Eğitim', value: 'egitim' },
    { label: 'Enerji', value: 'enerji' },
    { label: 'Geri Kazanım', value: 'geri-kazanim' },
    { label: 'Girişimcilik', value: 'girisimcilik' },
    { label: 'Hizmet Sektörü', value: 'hizmet-sektoru' },
    { label: 'İstihdam Destekleri', value: 'istihdam-destekleri' },
    { label: 'İzin-Ruhsat', value: 'izin-ruhsat' },
    { label: 'Kalkınma Ajansı', value: 'kalkinma-ajansi' },
    { label: 'Lojistik', value: 'lojistik' },
    { label: 'Maden', value: 'maden' },
    { label: 'Sağlık', value: 'saglik' },
    { label: 'Sanayi', value: 'sanayi' },
    { label: 'Sertifika/Belgelendirme', value: 'sertifika-belgelendirme' },
    { label: 'Sosyal Hizmetler', value: 'sosyal-hizmetler' },
    { label: 'Tanıtım Pazarlama', value: 'tanitim-pazarlama' },
    { label: 'Tarım Hayvancılık', value: 'tarim-hayvancilik' },
    { label: 'Tarıma Dayalı Sanayi', value: 'tarima-dayali-sanayi' },
    { label: 'Ticaret', value: 'ticaret' },
    { label: 'Turizm', value: 'turizm' },
    { label: 'Yatırım Teşvik Sistemi', value: 'yatirim-tesvik-sistemi' }
  ];

  useEffect(() => {
    fetchQuestions();
  }, [filterStatus]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting fetchQuestions with filter:', filterStatus);
      console.log('🌐 User agent:', navigator.userAgent);
      console.log('📱 Platform info:', {
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages
      });

      // Test connection first
      console.log('🔌 Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('soru_cevap')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('❌ Connection test failed:', testError);
        throw new Error(`Connection failed: ${testError.message}`);
      }

      console.log('✅ Connection test successful');

      // Build the main query
      let query = supabase
        .from('soru_cevap')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter if not 'all'
      if (filterStatus !== 'all') {
        console.log('🎯 Applying filter for status:', filterStatus);
        query = query.eq('answer_status', filterStatus);
      }

      console.log('📤 Executing main query...');
      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Query execution failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Query successful:', {
        totalRecords: data?.length || 0,
        count: count,
        firstRecordSample: data?.[0] ? {
          id: data[0].id,
          question_length: data[0].question?.length,
          question_preview: data[0].question?.substring(0, 50),
          answer_status: data[0].answer_status,
          full_name: data[0].full_name,
          email: data[0].email
        } : null
      });

      // Process the data with better encoding handling
      const processedData = (data || []).map((item, index) => {
        console.log(`🔄 Processing record ${index + 1}:`, {
          id: item.id,
          originalQuestion: item.question,
          questionLength: item.question?.length,
          hasAnswer: !!item.answer
        });

        // Ensure all text fields are properly handled
        const processed = {
          ...item,
          question: item.question || '',
          answer: item.answer || '',
          full_name: item.full_name || '',
          email: item.email || '',
          province: item.province || '',
          phone: item.phone || '',
          return_reason: item.return_reason || '',
          admin_notes: item.admin_notes || '',
          answer_status: item.answer_status || 'unanswered'
        };

        console.log(`✅ Processed record ${index + 1}:`, {
          id: processed.id,
          processedQuestion: processed.question.substring(0, 50),
          processedQuestionLength: processed.question.length
        });

        return processed;
      });

      console.log('🎯 Final processed data:', {
        totalProcessed: processedData.length,
        sampleData: processedData.slice(0, 2).map(item => ({
          id: item.id,
          question: item.question.substring(0, 30),
          full_name: item.full_name,
          answer_status: item.answer_status
        }))
      });

      setQuestions(processedData);
      console.log('✅ Questions state updated successfully');
      
    } catch (error) {
      console.error('💥 Critical error in fetchQuestions:', {
        error: error,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      toast.error(`Sorular yüklenirken hata oluştu: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      console.log('🏁 fetchQuestions completed');
    }
  };

  const handleAnswerQuestion = async () => {
    if (!selectedQuestion || !answer.trim()) {
      toast.error('Cevap alanı boş olamaz.');
      return;
    }

    try {
      console.log('Saving answer for question:', selectedQuestion.id);
      
      const updateData = {
        answer: answer.trim(),
        answer_status: answerStatus,
        answer_date: new Date().toISOString(),
        answered: true,
        answered_by_user_id: (await supabase.auth.getUser()).data.user?.id,
        category: selectedCategories.join(',')
      };

      console.log('Update data:', updateData);

      const { error } = await supabase
        .from('soru_cevap')
        .update(updateData)
        .eq('id', selectedQuestion.id);

      if (error) {
        console.error('Error updating question:', error);
        throw error;
      }

      console.log('Answer saved successfully');
      toast.success('Cevap başarıyla kaydedildi.');
      setIsAnswerDialogOpen(false);
      setAnswer('');
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error answering question:', error);
      toast.error('Cevap kaydedilirken hata oluştu: ' + (error as Error).message);
    }
  };

  const handleApproveAndSend = async (question: Question) => {
    if (!question.answer) {
      toast.error('Onaylanacak cevap bulunmuyor.');
      return;
    }

    try {
      console.log('Approving and sending answer for question:', question.id);
      
      // Update status to approved
      const { error: updateError } = await supabase
        .from('soru_cevap')
        .update({
          answer_status: 'approved',
          admin_sent: true,
          sent_to_user: true
        })
        .eq('id', question.id);

      if (updateError) {
        console.error('Error updating question status:', updateError);
        throw updateError;
      }

      console.log('Calling notification function...');
      // Send notification to user
      const { error: notificationError } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'answer_sent',
          questionData: {
            ...question,
            answer_status: 'approved'
          }
        }
      });

      if (notificationError) {
        console.error('Notification error:', notificationError);
        toast.error('Cevap onaylandı ancak e-posta gönderilirken hata oluştu.');
      } else {
        console.log('Notification sent successfully');
        toast.success('Cevap onaylandı ve kullanıcıya gönderildi.');
      }

      fetchQuestions();
    } catch (error) {
      console.error('Error approving answer:', error);
      toast.error('Cevap onaylanırken hata oluştu: ' + (error as Error).message);
    }
  };

  const handleReturnToYdo = async () => {
    if (!selectedQuestion || !returnReason.trim()) {
      toast.error('İade sebebi belirtilmelidir.');
      return;
    }

    try {
      console.log('Returning answer to YDO for question:', selectedQuestion.id);
      console.log('Current question return_status before update:', selectedQuestion.return_status);
      
      const updateData = {
        answer_status: 'returned' as const,
        return_status: 'returned' as const,
        return_reason: returnReason.trim(),
        return_date: new Date().toISOString(),
        admin_sent: false
      };
      
      console.log('Update data being sent:', updateData);
      
      // Update status to returned
      const { data, error: updateError } = await supabase
        .from('soru_cevap')
        .update(updateData)
        .eq('id', selectedQuestion.id)
        .select('return_status, answer_status');

       if (updateError) {
         console.error('Error updating question status:', updateError);
         throw updateError;
       }

       console.log('Database update successful. Updated data:', data);
       console.log('Question return_status after update:', data?.[0]?.return_status);

      console.log('Sending return notification...');
      // Send notification to YDO users
      const { error: notificationError } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'answer_returned',
          questionData: {
            ...selectedQuestion,
            return_reason: returnReason.trim(),
            answer_status: 'returned'
          }
        }
      });

      if (notificationError) {
        console.error('Notification error:', notificationError);
        toast.error('Cevap iade edildi ancak YDO kullanıcılarına bildirim gönderilirken hata oluştu.');
      } else {
        console.log('Return notification sent successfully');
        toast.success('Cevap YDO kullanıcılarına iade edildi.');
      }

      setIsReturnDialogOpen(false);
      setReturnReason('');
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error returning answer:', error);
      toast.error('Cevap iade edilirken hata oluştu: ' + (error as Error).message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'unanswered': { label: 'Cevaplanmadı', variant: 'outline' as const, className: 'bg-red-50 text-red-700 border-red-200' },
      'answered': { label: 'Cevaplandı', variant: 'outline' as const, className: 'bg-blue-50 text-blue-700 border-blue-200' },
      'returned': { label: 'İade Edildi', variant: 'outline' as const, className: 'bg-orange-50 text-orange-700 border-orange-200' },
      'corrected': { label: 'Düzeltildi', variant: 'outline' as const, className: 'bg-purple-50 text-purple-700 border-purple-200' },
      'approved': { label: 'Onaylandı', variant: 'outline' as const, className: 'bg-green-50 text-green-700 border-green-200' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'outline' as const,
      className: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const openViewDialog = (question: Question) => {
    console.log('Opening view dialog for question:', question.id);
    setSelectedQuestion(question);
    setIsViewDialogOpen(true);
  };

  const openAnswerDialog = (question: Question) => {
    console.log('Opening answer dialog for question:', question.id);
    setSelectedQuestion(question);
    setAnswer(question.answer || '');
    setAnswerStatus(question.answer_status || 'answered');
    // Parse existing categories if any
    const existingCategories = question.category ? question.category.split(',') : [];
    setSelectedCategories(existingCategories);
    setIsAnswerDialogOpen(true);
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(categoryOptions.map(option => option.value));
  };

  const handleDeselectAllCategories = () => {
    setSelectedCategories([]);
  };

  const openReturnDialog = (question: Question) => {
    console.log('Opening return dialog for question:', question.id);
    setSelectedQuestion(question);
    setReturnReason('');
    setIsReturnDialogOpen(true);
  };

  // Parse Excel date (serial number or string)
  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;
    
    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString();
    }
    
    // If it's already a Date object
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // If it's a string, try various formats
    if (typeof value === 'string') {
      // Try DD.MM.YYYY format
      const ddmmyyyy = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
      }
      
      // Try YYYY-MM-DD format
      const yyyymmdd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (yyyymmdd) {
        return new Date(value).toISOString();
      }
      
      // Try Date constructor as fallback
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    
    return null;
  };

  // Download template Excel
  const downloadTemplate = () => {
    const templateData = [
      {
        'Soru No': '',
        'Ad Soyad': 'Örnek: Ahmet Yılmaz',
        'E-posta': 'ornek@email.com',
        'Telefon': '05551234567',
        'İl': 'Ankara',
        'Kategori': 'yatirim-tesvik-sistemi,sanayi',
        'Soru': 'Örnek soru metni buraya yazılır...',
        'Cevap': 'Opsiyonel cevap metni...',
        'Durum': 'unanswered',
        'Oluşturma Tarihi': '01.01.2025'
      }
    ];

    // Category reference sheet
    const categoryData = categoryOptions.map(cat => ({
      'Kategori Kodu': cat.value,
      'Kategori Adı': cat.label
    }));

    // Status reference
    const statusData = [
      { 'Durum Kodu': 'unanswered', 'Açıklama': 'Cevaplanmadı' },
      { 'Durum Kodu': 'answered', 'Açıklama': 'Cevaplandı' },
      { 'Durum Kodu': 'returned', 'Açıklama': 'İade Edildi' },
      { 'Durum Kodu': 'approved', 'Açıklama': 'Onaylandı' }
    ];

    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.json_to_sheet(templateData);
    ws1['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 50 },
      { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Sorular');
    
    const ws2 = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Kategori Listesi');
    
    const ws3 = XLSX.utils.json_to_sheet(statusData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Durum Listesi');

    XLSX.writeFile(wb, 'soru_cevap_sablonu.xlsx');
    toast.success('Şablon indirildi');
  };

  // Handle file upload for bulk import
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('Dosyada veri bulunamadı');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        const fullName = row['Ad Soyad']?.toString().trim();
        const email = row['E-posta']?.toString().trim();
        const province = row['İl']?.toString().trim();
        const question = row['Soru']?.toString().trim();

        // Validate required fields
        if (!fullName || !email || !province || !question) {
          errorCount++;
          continue;
        }

        const insertData: any = {
          full_name: fullName,
          email: email,
          province: province,
          question: question,
          phone: row['Telefon']?.toString().trim() || null,
          category: row['Kategori']?.toString().trim() || null,
          answer: row['Cevap']?.toString().trim() || null,
          answer_status: row['Durum']?.toString().trim() || 'unanswered',
          answered: !!row['Cevap']
        };

        // Parse dates if provided
        const createdAt = parseExcelDate(row['Oluşturma Tarihi']);
        if (createdAt) {
          insertData.created_at = createdAt;
        }

        const { error } = await supabase
          .from('soru_cevap')
          .insert(insertData);

        if (error) {
          console.error('Insert error:', error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      toast.success(`${successCount} soru başarıyla eklendi${errorCount > 0 ? `, ${errorCount} hata` : ''}`);
      fetchQuestions();
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Dosya işlenirken hata oluştu');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    setExporting(true);
    
    try {
      const { data, error } = await supabase
        .from('soru_cevap')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const exportData = (data || []).map(q => ({
        'Soru No': q.question_number || '',
        'Ad Soyad': q.full_name,
        'E-posta': q.email,
        'Telefon': q.phone || '',
        'İl': q.province,
        'Kategori': q.category || '',
        'Soru': q.question,
        'Cevap': q.answer || '',
        'Durum': q.answer_status || 'unanswered',
        'İade Sebebi': q.return_reason || '',
        'Oluşturma Tarihi': q.created_at ? new Date(q.created_at).toLocaleDateString('tr-TR') : '',
        'Cevap Tarihi': q.answer_date ? new Date(q.answer_date).toLocaleDateString('tr-TR') : '',
        'İade Tarihi': q.return_date ? new Date(q.return_date).toLocaleDateString('tr-TR') : '',
        'Cevaplayayan': q.answered_by_full_name || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 50 },
        { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Sorular');

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `soru_cevap_export_${timestamp}.xlsx`);
      toast.success(`${exportData.length} soru dışa aktarıldı`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Dışa aktarma sırasında hata oluştu');
    } finally {
      setExporting(false);
    }
  };

  // Delete all questions
  const handleDeleteAllQuestions = async () => {
    setDeleting(true);
    
    try {
      // First delete related audit trail entries
      const { error: auditError } = await supabase
        .from('qna_audit_trail')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (auditError) {
        console.error('Audit trail delete error:', auditError);
      }

      // Then delete all questions
      const { error } = await supabase
        .from('soru_cevap')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast.success('Tüm sorular silindi');
      fetchQuestions();
    } catch (error) {
      console.error('Delete all error:', error);
      toast.error('Silme işlemi sırasında hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('🎨 Rendering component with questions:', questions.length);

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            {/* Row 1: Title + Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-bold text-slate-800">
                    Soru & Cevap Yönetimi
                  </CardTitle>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {questions.length} Soru
                  </Badge>
                </div>
              </div>
            </div>

            {/* Row 2: Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      className="gap-2 h-9"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="hidden sm:inline">Şablon</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Şablon İndir</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className="gap-2 h-9"
                    >
                      {importing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">İçe Aktar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excel'den İçe Aktar</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToExcel}
                      disabled={exporting}
                      className="gap-2 h-9"
                    >
                      {exporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Dışa Aktar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excel'e Dışa Aktar</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <AlertDialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleting || questions.length === 0}
                          className="gap-2 h-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                          {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Tümünü Sil</span>
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Tüm Soruları Sil</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Tüm Soruları Sil
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem <strong>{questions.length}</strong> soruyu kalıcı olarak silecektir. 
                      Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllQuestions}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Evet, Tümünü Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Row 3: Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Soru ara..."
                  className="pl-10 h-10 w-full bg-white/80 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 w-full sm:w-44 bg-white/80 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                  <SelectValue placeholder="Durum Filtrele" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="unanswered">Cevaplanmadı</SelectItem>
                  <SelectItem value="answered">Cevaplandı</SelectItem>
                  <SelectItem value="returned">İade Edildi</SelectItem>
                  <SelectItem value="approved">Onaylandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
          
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-slate-600 mt-4 text-lg">Yükleniyor...</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] pr-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="font-semibold text-slate-700">Soru No</TableHead>
                    <TableHead className="font-semibold text-slate-700">Soru & Soru Sahibi</TableHead>
                    <TableHead className="font-semibold text-slate-700">Durum</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="font-mono text-sm font-medium text-blue-600">
                          #{question.question_number || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="space-y-2">
                          <div className="font-medium text-slate-900 truncate" title={question.question}>
                            {question.question}
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {question.full_name}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {question.province}
                            </Badge>
                            {question.answered_by_full_name && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                Yanıtlayan: {question.answered_by_full_name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(question.created_at).toLocaleDateString('tr-TR')} • {question.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(question.answer_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewDialog(question)}
                            className="h-8 w-8 p-0 bg-white/80 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAnswerDialog(question)}
                            className="h-8 w-8 p-0 bg-white/80 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                          >
                            <Edit className="h-4 w-4 text-orange-600" />
                          </Button>
                          {question.answer && (question.answer_status === 'answered' || question.answer_status === 'corrected') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveAndSend(question)}
                                className="h-8 w-8 p-0 bg-white/80 hover:bg-green-50 hover:border-green-200 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openReturnDialog(question)}
                                className="h-8 w-8 p-0 bg-white/80 hover:bg-red-50 hover:border-red-200 transition-colors"
                              >
                                <ArrowLeft className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {questions.length === 0 && (
                <div className="text-center py-16">
                  <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg mb-2">
                    {filterStatus === 'all' ? 'Henüz soru bulunmamaktadır' : 'Bu durumda soru bulunmamaktadır'}
                  </p>
                  <p className="text-slate-500">Sorular geldiğinde burada görünecektir.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Question Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Soru Detayları</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Soru No</Label>
                  <p className="text-sm font-mono">#{selectedQuestion.question_number || 'N/A'}</p>
                </div>
                <div>
                  <Label>Ad Soyad</Label>
                  <p className="text-sm">{selectedQuestion.full_name}</p>
                </div>
                <div>
                  <Label>E-posta</Label>
                  <p className="text-sm">{selectedQuestion.email}</p>
                </div>
                <div>
                  <Label>Telefon</Label>
                  <p className="text-sm">{selectedQuestion.phone || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <Label>İl</Label>
                  <p className="text-sm">{selectedQuestion.province}</p>
                </div>
                <div>
                  <Label>Yanıtlayan</Label>
                  <p className="text-sm">{selectedQuestion.answered_by_full_name || 'Henüz yanıtlanmadı'}</p>
                </div>
              </div>
              <div>
                <Label>Soru</Label>
                <div className="bg-gray-50 p-3 rounded-md mt-1">
                  {selectedQuestion.question}
                </div>
              </div>
              {selectedQuestion.answer && (
                <div>
                  <Label>Cevap</Label>
                  <div className="bg-blue-50 p-3 rounded-md mt-1">
                    {selectedQuestion.answer}
                  </div>
                </div>
              )}
              {selectedQuestion.return_reason && (
                <div>
                  <Label>İade Sebebi</Label>
                  <div className="bg-red-50 p-3 rounded-md mt-1">
                    {selectedQuestion.return_reason}
                  </div>
                </div>
              )}
              <div>
                <Label>Durum</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedQuestion.answer_status)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Answer Question Dialog */}
      <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Soruyu Cevapla</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
               <div>
                 <Label>Soru</Label>
                 <div className="bg-gray-50 p-3 rounded-md mt-1">
                   {selectedQuestion.question}
                 </div>
               </div>
               
               {selectedQuestion.answered_by_full_name && (
                 <div>
                   <Label>Yanıtlayan YDO Kullanıcısı</Label>
                   <div className="bg-blue-50 p-3 rounded-md mt-1 font-medium">
                     {selectedQuestion.answered_by_full_name}
                   </div>
                 </div>
               )}
               
               <div>
                 <Label htmlFor="answer">Cevap</Label>
                 <Textarea
                   id="answer"
                   value={answer}
                   onChange={(e) => setAnswer(e.target.value)}
                   placeholder="Cevabınızı buraya yazın..."
                   rows={6}
                 />
               </div>
               
               <div>
                 <Label>Kategori Etiketleri</Label>
                 <div className="space-y-3">
                   <div className="flex gap-2">
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                       onClick={handleSelectAllCategories}
                       className="text-xs"
                     >
                       Tümünü Seç
                     </Button>
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                       onClick={handleDeselectAllCategories}
                       className="text-xs"
                     >
                       Tümünü Kaldır
                     </Button>
                   </div>
                   <MultiSelect
                     options={categoryOptions}
                     selected={selectedCategories}
                     onChange={setSelectedCategories}
                     placeholder="Kategori seçin..."
                     searchPlaceholder="Kategori ara..."
                     emptyText="Kategori bulunamadı."
                     maxDisplay={3}
                   />
                 </div>
               </div>
               
               <div>
                 <Label>Durum</Label>
                 <Select value={answerStatus} onValueChange={setAnswerStatus}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="answered">Cevaplandı</SelectItem>
                     <SelectItem value="returned">İade Edildi</SelectItem>
                     <SelectItem value="approved">Onaylandı</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAnswerDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleAnswerQuestion}>
                  Cevabı Kaydet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Answer Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cevabı YDO'ya İade Et</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div>
                <Label>Soru</Label>
                <div className="bg-gray-50 p-3 rounded-md mt-1">
                  {selectedQuestion.question}
                </div>
              </div>
              {selectedQuestion.answer && (
                <div>
                  <Label>Mevcut Cevap</Label>
                  <div className="bg-blue-50 p-3 rounded-md mt-1">
                    {selectedQuestion.answer}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="returnReason">İade Sebebi</Label>
                <Textarea
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Cevabın neden iade edildiğini açıklayın..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
                  İptal
                </Button>
                <Button variant="destructive" onClick={handleReturnToYdo}>
                  YDO'ya İade Et
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QnaQuestionManagement;
