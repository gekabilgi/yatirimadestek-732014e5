import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, Send, RotateCcw, CheckCheck, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Question } from '@/types/qna';

const QAManagement = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('soru_cevap')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast answer_status to the correct type
      const typedData = (data || []).map(item => ({
        ...item,
        answer_status: item.answer_status as Question['answer_status']
      }));
      
      setQuestions(typedData);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getStatusBadge = (question: Question) => {
    switch (question.answer_status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Onaylandı</Badge>;
      case 'returned':
        return <Badge className="bg-red-100 text-red-800">İade Edildi</Badge>;
      case 'corrected':
        return <Badge className="bg-yellow-100 text-yellow-800">Düzeltildi</Badge>;
      case 'answered':
        return <Badge className="bg-blue-100 text-blue-800">Yanıtlandı</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Bekliyor</Badge>;
    }
  };

  const canReturn = (question: Question) => {
    return (question.answer_status === 'answered' || question.answer_status === 'corrected') && !question.admin_sent;
  };

  const canApprove = (question: Question) => {
    return (question.answer_status === 'answered' || question.answer_status === 'corrected') && !question.admin_sent;
  };

  const canEdit = (question: Question) => {
    return question.answer_status !== 'approved' && !question.admin_sent;
  };

  const isFinalized = (question: Question) => {
    return question.answer_status === 'approved' || question.admin_sent;
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setAnswer(question.answer || '');
  };

  const handleReturnAnswer = async () => {
    if (!selectedQuestion || !returnReason.trim()) {
      toast.error('Please provide a return reason');
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('soru_cevap')
        .update({
          answer_status: 'returned',
          return_reason: returnReason.trim(),
          return_date: new Date().toISOString(),
          admin_sent: false
        })
        .eq('id', selectedQuestion.id);

      if (updateError) throw updateError;

      // Send notification that answer was returned - passing the full question data
      const { error: notificationError } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'answer_returned',
          questionData: {
            ...selectedQuestion,
            return_reason: returnReason.trim()
          }
        }
      });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      toast.success('Yanıt başarıyla iade edildi');
      setShowReturnDialog(false);
      setReturnReason('');
      setSelectedQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error returning answer:', error);
      toast.error('Failed to return answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAnswer = async () => {
    if (!selectedQuestion) return;

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('soru_cevap')
        .update({
          answer_status: 'approved',
          approved_by_admin_id: (await supabase.auth.getUser()).data.user?.id || null,
          admin_sent: true,
          sent_to_user: true
        })
        .eq('id', selectedQuestion.id);

      if (updateError) throw updateError;

      // Send notification that answer was approved and sent
      const { error: notificationError } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'answer_sent',
          questionId: selectedQuestion.id
        }
      });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      toast.success('Yanıt onaylandı ve kullanıcıya gönderildi');
      setSelectedQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error approving answer:', error);
      toast.error('Failed to approve answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('soru_cevap')
        .update({
          answer: answer.trim(),
          answered: true,
          answer_date: new Date().toISOString(),
          answer_status: 'answered',
          admin_sent: false
        })
        .eq('id', selectedQuestion.id);

      if (updateError) throw updateError;

      toast.success('Yanıt başarıyla güncellendi');
      setShowEditDialog(false);
      setSelectedQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error('Error updating answer:', error);
      toast.error('Failed to update answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Sorular yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (selectedQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setSelectedQuestion(null)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                Soru Detayları
                {getStatusBadge(selectedQuestion)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Soru Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Ad Soyad</Label>
                    <p className="text-gray-900">{selectedQuestion.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">E-posta</Label>
                    <p className="text-gray-900">{selectedQuestion.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">İl</Label>
                    <p className="text-gray-900">{selectedQuestion.province}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Tarih</Label>
                    <p className="text-gray-900">{formatDate(selectedQuestion.created_at)}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Soru</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <p className="whitespace-pre-wrap">{selectedQuestion.question}</p>
                  </div>
                </div>
              </div>

              {selectedQuestion.answer_status === 'returned' && selectedQuestion.return_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">İade Sebebi:</h4>
                  <p className="text-red-700">{selectedQuestion.return_reason}</p>
                  {selectedQuestion.return_date && (
                    <p className="text-sm text-red-600 mt-1">
                      İade Tarihi: {formatDate(selectedQuestion.return_date)}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Yanıt</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border min-h-[120px]">
                  {selectedQuestion.answer ? (
                    <p className="whitespace-pre-wrap">{selectedQuestion.answer}</p>
                  ) : (
                    <p className="text-gray-500 italic">Henüz yanıt verilmemiş</p>
                  )}
                </div>
              </div>

              {isFinalized(selectedQuestion) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    Yanıt onaylanmış ve kullanıcıya gönderilmiştir.
                  </p>
                  {selectedQuestion.answer_date && (
                    <p className="text-sm text-green-700 mt-1">
                      Yanıt Tarihi: {formatDate(selectedQuestion.answer_date)}
                    </p>
                  )}
                </div>
              )}

              {!isFinalized(selectedQuestion) && selectedQuestion.answer && (
                <div className="flex gap-4 flex-wrap">
                  {canEdit(selectedQuestion) && (
                    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setAnswer(selectedQuestion.answer || '')}>
                          <Edit className="mr-2 h-4 w-4" />
                          Yanıtı Düzenle
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Yanıtı Düzenle</DialogTitle>
                          <DialogDescription>
                            Sorunun yanıtını düzenleyebilirsiniz.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-answer">Yanıt</Label>
                            <Textarea
                              id="edit-answer"
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              rows={6}
                              className="mt-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleEditAnswer}
                              disabled={submitting || !answer.trim()}
                            >
                              {submitting ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowEditDialog(false)}
                            >
                              İptal
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {canReturn(selectedQuestion) && (
                    <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          YDO'ya İade Et
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Yanıtı İade Et</DialogTitle>
                          <DialogDescription>
                            Yanıtı YDO kullanıcısına iade etmek için sebebini belirtiniz.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="return-reason">İade Sebebi *</Label>
                            <Textarea
                              id="return-reason"
                              value={returnReason}
                              onChange={(e) => setReturnReason(e.target.value)}
                              placeholder="İade sebebini açıklayınız..."
                              rows={4}
                              className="mt-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleReturnAnswer}
                              disabled={submitting || !returnReason.trim()}
                              variant="destructive"
                            >
                              {submitting ? "İade Ediliyor..." : "İade Et"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowReturnDialog(false)}
                            >
                              İptal
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {canApprove(selectedQuestion) && (
                    <Button onClick={handleApproveAnswer} disabled={submitting}>
                      {submitting ? (
                        "Onaylanıyor..."
                      ) : (
                        <>
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Onayla ve Kullanıcıya Gönder
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Soru & Cevap Yönetimi</CardTitle>
            <p className="text-gray-600">
              Gelen soruları görüntüleyin, yanıtları kontrol edin ve onaylayın
            </p>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Henüz soru bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Soru</TableHead>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>İl</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Yanıt Tarihi</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={question.question}>
                            {question.question.length > 100
                              ? `${question.question.substring(0, 100)}...`
                              : question.question}
                          </div>
                        </TableCell>
                        <TableCell>{question.full_name}</TableCell>
                        <TableCell>{question.email}</TableCell>
                        <TableCell>{question.province}</TableCell>
                        <TableCell>{formatDate(question.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(question)}</TableCell>
                        <TableCell>
                          {question.answer_date ? formatDate(question.answer_date) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewQuestion(question)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Görüntüle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QAManagement;
