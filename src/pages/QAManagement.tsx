
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Eye, Reply, RotateCcw, Send, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import MainNavbar from '@/components/MainNavbar';
import type { Question } from '@/types/qna';

const QAManagement = () => {
  const { user, isAdmin } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (user) {
      fetchQuestions();
    }
  }, [user]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('soru_cevap')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Sorular yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) {
      toast.error('Lütfen yanıt metni giriniz.');
      return;
    }

    try {
      const { error } = await supabase
        .from('soru_cevap')
        .update({
          answer: answerText,
          answered: true,
          answer_date: new Date().toISOString(),
          answered_by_user_id: user?.id,
          category: category || null,
          answer_status: 'answered'
        })
        .eq('id', questionId);

      if (error) throw error;

      // Log audit trail
      await supabase.rpc('log_qna_audit', {
        p_soru_cevap_id: questionId,
        p_action: 'answered',
        p_user_role: isAdmin ? 'admin' : 'ydo',
        p_notes: `Answer provided: ${answerText.substring(0, 100)}...`
      });

      toast.success('Yanıt başarıyla kaydedildi.');
      fetchQuestions();
      setSelectedQuestion(null);
      setAnswerText('');
      setCategory('');
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Yanıt kaydedilirken hata oluştu.');
    }
  };

  const handleReturnAnswer = async (questionId: string) => {
    if (!returnReason.trim()) {
      toast.error('Lütfen iade sebebini giriniz.');
      return;
    }

    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const { error } = await supabase
        .from('soru_cevap')
        .update({
          answer_status: 'returned',
          return_reason: returnReason,
          return_date: new Date().toISOString(),
          admin_sent: false
        })
        .eq('id', questionId);

      if (error) throw error;

      // Send return notification to YDO user
      try {
        await supabase.functions.invoke('send-qna-notifications', {
          body: {
            type: 'answer_returned',
            questionId: questionId,
            questionData: {
              ...question,
              return_reason: returnReason
            }
          }
        });
        console.log('Return notification sent to YDO user');
      } catch (emailError) {
        console.error('Error sending return notification:', emailError);
      }

      // Log audit trail
      await supabase.rpc('log_qna_audit', {
        p_soru_cevap_id: questionId,
        p_action: 'returned_to_ydo',
        p_user_role: 'admin',
        p_notes: returnReason
      });

      toast.success('Yanıt YDO kullanıcısına iade edildi.');
      fetchQuestions();
      setSelectedQuestion(null);
      setReturnReason('');
    } catch (error) {
      console.error('Error returning answer:', error);
      toast.error('Yanıt iade edilirken hata oluştu.');
    }
  };

  const handleApproveAndSend = async (questionId: string, userEmail: string) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const { error } = await supabase
        .from('soru_cevap')
        .update({
          sent_to_user: true,
          admin_sent: true,
          answer_status: 'approved',
          approved_by_admin_id: user?.id
        })
        .eq('id', questionId);

      if (error) throw error;

      // Send email notification to user
      try {
        await supabase.functions.invoke('send-qna-notifications', {
          body: {
            type: 'answer_sent',
            questionId: questionId,
            questionData: {
              full_name: question.full_name,
              email: question.email,
              question: question.question,
              answer: question.answer
            }
          }
        });
        console.log('Answer email sent to user');
      } catch (emailError) {
        console.error('Error sending answer email:', emailError);
      }

      // Log audit trail
      await supabase.rpc('log_qna_audit', {
        p_soru_cevap_id: questionId,
        p_action: 'approved_and_sent',
        p_user_role: 'admin',
        p_notes: `Answer approved and sent to user: ${userEmail}`
      });

      toast.success('Yanıt onaylandı ve kullanıcıya gönderildi.');
      fetchQuestions();
    } catch (error) {
      console.error('Error approving and sending answer:', error);
      toast.error('Yanıt onaylanırken hata oluştu.');
    }
  };

  const getStatusBadge = (question: Question) => {
    switch (question.answer_status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Onaylandı</Badge>;
      case 'returned':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />İade Edildi</Badge>;
      case 'corrected':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Düzeltildi</Badge>;
      case 'answered':
        return <Badge className="bg-blue-100 text-blue-800"><Reply className="h-3 w-3 mr-1" />Yanıtlandı</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><MessageSquare className="h-3 w-3 mr-1" />Beklemede</Badge>;
    }
  };

  const canEditAnswer = (question: Question) => {
    return !question.admin_sent && question.answer_status !== 'approved';
  };

  const canReturnAnswer = (question: Question) => {
    return question.answer_status === 'answered' || question.answer_status === 'corrected';
  };

  const canApproveAnswer = (question: Question) => {
    return (question.answer_status === 'answered' || question.answer_status === 'corrected') && !question.admin_sent;
  };

  const isFinalized = (question: Question) => {
    return question.answer_status === 'approved' || question.admin_sent;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Soru-Cevap Yönetimi</h1>
          <p className="text-gray-600">Gelen soruları yanıtlayın ve yönetin.</p>
        </div>

        <div className="grid gap-6">
          {questions.map((question) => (
            <Card key={question.id} className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{question.full_name}</CardTitle>
                    <div className="flex gap-2 text-sm text-gray-500">
                      <span>{question.email}</span>
                      <span>•</span>
                      <span>{question.province}</span>
                      <span>•</span>
                      <span>{new Date(question.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                  {getStatusBadge(question)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Soru:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{question.question}</p>
                  </div>

                  {question.answer && (
                    <div>
                      <h4 className="font-semibold mb-2">Yanıt:</h4>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{question.answer}</p>
                    </div>
                  )}

                  {question.return_reason && (
                    <div>
                      <h4 className="font-semibold mb-2">İade Sebebi:</h4>
                      <p className="text-gray-700 bg-red-50 p-3 rounded-lg">{question.return_reason}</p>
                      {question.return_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          İade Tarihi: {new Date(question.return_date).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                  )}

                  {isFinalized(question) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700 font-medium">
                        ✅ Bu yanıt onaylanmış ve kullanıcıya gönderilmiştir. Artık düzenlenemez.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {canEditAnswer(question) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuestion(question);
                              setAnswerText(question.answer || '');
                              setCategory(question.category || '');
                            }}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            {question.answer ? 'Yanıtı Düzenle' : 'Yanıtla'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Soruya Yanıt Ver</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Kategori</Label>
                              <Input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Kategori giriniz"
                              />
                            </div>
                            <div>
                              <Label>Yanıt</Label>
                              <Textarea
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                rows={6}
                                placeholder="Yanıtınızı yazınız..."
                              />
                            </div>
                            <Button onClick={() => handleAnswer(question.id)}>
                              <Send className="h-4 w-4 mr-1" />
                              Yanıtı Kaydet
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {canApproveAnswer(question) && isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => handleApproveAndSend(question.id, question.email)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Onayla ve Gönder
                      </Button>
                    )}

                    {canReturnAnswer(question) && isAdmin && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuestion(question);
                              setReturnReason('');
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            YDO'ya İade Et
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Yanıtı YDO'ya İade Et</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>İade Sebebi</Label>
                              <Textarea
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                rows={4}
                                placeholder="İade sebebini açıklayınız..."
                              />
                            </div>
                            <Button onClick={() => handleReturnAnswer(question.id)}>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              İade Et
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QAManagement;
