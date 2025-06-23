
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MessageSquare, Calendar, User, MapPin, CheckCircle, XCircle, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Question } from '@/types/qna';

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

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      console.log('Fetching questions with filter:', filterStatus);
      
      // Build query with proper text handling for Turkish characters
      let query = supabase
        .from('soru_cevap')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filter if not 'all' - use text comparison that handles Turkish characters properly
      if (filterStatus !== 'all') {
        query = query.eq('answer_status', filterStatus);
      }

      console.log('Executing query...');
      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Query successful. Found', count, 'records');
      console.log('Sample data:', data?.slice(0, 2));
      
      // Ensure text fields are properly decoded
      const processedData = data?.map(question => ({
        ...question,
        question: question.question || '',
        answer: question.answer || '',
        full_name: question.full_name || '',
        email: question.email || '',
        province: question.province || '',
        phone: question.phone || '',
        return_reason: question.return_reason || '',
        admin_notes: question.admin_notes || '',
        answer_status: question.answer_status || 'unanswered'
      })) || [];

      console.log('Processed data:', processedData.length, 'questions');
      setQuestions(processedData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Sorular yüklenirken hata oluştu: ' + (error as Error).message);
    } finally {
      setLoading(false);
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
        answered_by_user_id: (await supabase.auth.getUser()).data.user?.id
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
      
      // Update status to returned
      const { error: updateError } = await supabase
        .from('soru_cevap')
        .update({
          answer_status: 'returned',
          return_reason: returnReason.trim(),
          return_date: new Date().toISOString(),
          admin_sent: false
        })
        .eq('id', selectedQuestion.id);

      if (updateError) {
        console.error('Error updating question status:', updateError);
        throw updateError;
      }

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
      'unanswered': { label: 'Cevaplanmadı', variant: 'destructive' as const },
      'answered': { label: 'Cevaplandı', variant: 'default' as const },
      'returned': { label: 'İade Edildi', variant: 'secondary' as const },
      'corrected': { label: 'Düzeltildi', variant: 'outline' as const },
      'approved': { label: 'Onaylandı', variant: 'default' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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
    setIsAnswerDialogOpen(true);
  };

  const openReturnDialog = (question: Question) => {
    console.log('Opening return dialog for question:', question.id);
    setSelectedQuestion(question);
    setReturnReason('');
    setIsReturnDialogOpen(true);
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
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Soru & Cevap Yönetimi
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value) => {
                console.log('Filter changed to:', value);
                setFilterStatus(value);
                fetchQuestions();
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Durum Filtrele" />
                </SelectTrigger>
                <SelectContent>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Soru Sahibi</TableHead>
                <TableHead>İl</TableHead>
                <TableHead>Soru</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{question.full_name}</span>
                      <span className="text-sm text-gray-500">{question.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {question.province}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={question.question}>
                      {question.question}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(question.answer_status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(question.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(question)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAnswerDialog(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {question.answer && (question.answer_status === 'answered' || question.answer_status === 'corrected') && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveAndSend(question)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openReturnDialog(question)}
                          >
                            <ArrowLeft className="h-4 w-4" />
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
            <div className="text-center py-8 text-gray-500">
              {filterStatus === 'all' ? 'Henüz soru bulunmamaktadır.' : 'Bu durumda soru bulunmamaktadır.'}
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
