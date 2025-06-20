
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Eye, Reply, RotateCcw, Send, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import MainNavbar from '@/components/MainNavbar';

interface Question {
  id: string;
  category: string | null;
  question: string;
  answer: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  province: string;
  created_at: string;
  answered: boolean;
  answer_date: string | null;
  sent_to_ydo: boolean;
  sent_to_user: boolean;
  return_status: 'returned' | 'corrected' | null;
  admin_notes: string | null;
}

const QAManagement = () => {
  const { user, isAdmin } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
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
          category: category || null
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

  const handleApproveAndSend = async (questionId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('soru_cevap')
        .update({
          sent_to_user: true,
          approved_by_admin_id: user?.id
        })
        .eq('id', questionId);

      if (error) throw error;

      // Log audit trail
      await supabase.rpc('log_qna_audit', {
        p_soru_cevap_id: questionId,
        p_action: 'sent_to_user',
        p_user_role: 'admin',
        p_notes: `Answer approved and sent to user: ${userEmail}`
      });

      toast.success('Yanıt kullanıcıya gönderildi.');
      fetchQuestions();
    } catch (error) {
      console.error('Error sending answer:', error);
      toast.error('Yanıt gönderilirken hata oluştu.');
    }
  };

  const handleReturn = async (questionId: string) => {
    if (!adminNotes.trim()) {
      toast.error('Lütfen iade notunu giriniz.');
      return;
    }

    try {
      const { error } = await supabase
        .from('soru_cevap')
        .update({
          return_status: 'returned',
          admin_notes: adminNotes
        })
        .eq('id', questionId);

      if (error) throw error;

      // Log audit trail
      await supabase.rpc('log_qna_audit', {
        p_soru_cevap_id: questionId,
        p_action: 'returned',
        p_user_role: 'admin',
        p_notes: adminNotes
      });

      toast.success('Soru iade edildi.');
      fetchQuestions();
      setSelectedQuestion(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error returning question:', error);
      toast.error('Soru iade edilirken hata oluştu.');
    }
  };

  const getStatusBadge = (question: Question) => {
    if (question.sent_to_user) {
      return <Badge className="bg-green-100 text-green-800">Gönderildi</Badge>;
    }
    if (question.return_status === 'returned') {
      return <Badge className="bg-red-100 text-red-800">İade Edildi</Badge>;
    }
    if (question.return_status === 'corrected') {
      return <Badge className="bg-yellow-100 text-yellow-800">Düzeltildi</Badge>;
    }
    if (question.answered) {
      return <Badge className="bg-blue-100 text-blue-800">Yanıtlandı</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Beklemede</Badge>;
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

                  {question.admin_notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Admin Notları:</h4>
                      <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{question.admin_notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
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
                          {question.answered ? 'Yanıtı Düzenle' : 'Yanıtla'}
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

                    {question.answered && !question.sent_to_user && isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => handleApproveAndSend(question.id, question.email)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Onayla ve Gönder
                      </Button>
                    )}

                    {isAdmin && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuestion(question);
                              setAdminNotes(question.admin_notes || '');
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            İade Et
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Soruyu İade Et</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>İade Notu</Label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={4}
                                placeholder="İade sebebini açıklayınız..."
                              />
                            </div>
                            <Button onClick={() => handleReturn(question.id)}>
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
