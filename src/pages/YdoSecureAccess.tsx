
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, Edit, Send, AlertCircle, Smartphone, Monitor, Clock, User, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { verifyYdoToken, type YdoTokenPayload } from '@/utils/tokenUtils';
import { toast } from 'sonner';
import type { Question } from '@/types/qna';

const YdoSecureAccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState<YdoTokenPayload | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      toast.error('Erişim anahtarı gerekli');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    const payload = verifyYdoToken(token);
    
    if (!payload) {
      toast.error('Geçersiz veya süresi dolmuş erişim anahtarı');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    setTokenData(payload);
    loadQuestions(token);
  }, [searchParams, navigate]);

  const loadQuestions = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'fetch_ydo_questions',
          token: token
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      const fetchedQuestions = data.questions || [];
      
      const typedData = fetchedQuestions.map((item: any) => ({
        ...item,
        answer_status: item.answer_status as Question['answer_status']
      }));
      
      setQuestions(typedData);
      toast.success(`${typedData.length} soru yüklendi`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error loading questions:', errorMessage);
      toast.error('Sorular yüklenirken hata oluştu');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setAnswer(question.answer || '');
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setAnswer(question.answer || '');
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answer.trim() || !tokenData) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);
    const token = searchParams.get('token');

    try {
      const isCorrection = selectedQuestion.answer_status === 'returned';

      const { data, error } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'submit_ydo_answer',
          token: token,
          questionData: {
            questionId: selectedQuestion.id,
            answer: answer.trim(),
            isCorrection: isCorrection,
            full_name: selectedQuestion.full_name,
            email: selectedQuestion.email,
            province: selectedQuestion.province,
            question: selectedQuestion.question
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      const successMessage = isCorrection 
        ? 'Düzeltilmiş yanıt başarıyla gönderildi'
        : 'Yanıt başarıyla gönderildi';
      
      toast.success(successMessage);
      setSelectedQuestion(null);
      setAnswer('');
      
      if (token) {
        loadQuestions(token);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getStatusBadge = (question: Question) => {
    switch (question.answer_status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 text-xs">Onaylandı</Badge>;
      case 'returned':
        return <Badge className="bg-red-100 text-red-800 text-xs">İade Edildi</Badge>;
      case 'corrected':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Düzeltildi</Badge>;
      case 'answered':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Yanıtlandı</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Bekliyor</Badge>;
    }
  };

  const canEditAnswer = (question: Question) => {
    return question.answer_status === 'unanswered' || question.answer_status === 'returned';
  };

  const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Sorular yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (selectedQuestion) {
    const isReturned = selectedQuestion.answer_status === 'returned';
    const canEdit = canEditAnswer(selectedQuestion);

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
                {canEdit ? 'Soruyu Yanıtla' : 'Yanıtı Görüntüle'}
                {getStatusBadge(selectedQuestion)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Soru Detayları</h3>
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

              {isReturned && selectedQuestion.return_reason && (
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
                <Label htmlFor="answer" className="text-sm font-medium">
                  Yanıt {canEdit && '*'}
                </Label>
                <Textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Sorunun yanıtını buraya yazınız..."
                  rows={8}
                  className="mt-2"
                  disabled={!canEdit}
                />
              </div>

              {canEdit && (
                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !answer.trim()}
                    className="flex-1"
                  >
                    {submitting ? (
                      "Gönderiliyor..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {isReturned ? 'Düzeltilmiş Yanıtı Gönder' : 'Yanıtı Gönder'}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!canEdit && selectedQuestion.answer_date && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Bu soru {formatDate(selectedQuestion.answer_date)} tarihinde yanıtlanmıştır.
                    {selectedQuestion.answer_status === 'approved' && ' Yanıt onaylanmış ve kullanıcıya gönderilmiştir.'}
                  </p>
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
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              {isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              YDO Soru Paneli - {tokenData?.province}
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600">
              {tokenData?.province} ili için gelen sorular ({questions.length} adet)
            </p>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Soru Bulunamadı</h3>
                <p className="text-gray-500 mb-1">İl: "{tokenData?.province}"</p>
                <p className="text-sm text-gray-400">
                  Henüz bu il için soru gelmemiş olabilir.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {questions.map((question) => (
                    <Card key={question.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <h3 className="font-medium text-sm text-gray-900 truncate">
                                {question.full_name}
                              </h3>
                            </div>
                            {getStatusBadge(question)}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{question.email}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDate(question.created_at)}</span>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded border">
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {question.question.length > 120
                                ? `${question.question.substring(0, 120)}...`
                                : question.question}
                            </p>
                          </div>
                          
                          {question.answer_date && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Yanıtlandı: {formatDate(question.answer_date)}
                            </div>
                          )}
                          
                          <div className="pt-2 border-t border-gray-100">
                            {canEditAnswer(question) ? (
                              <Button
                                size="sm"
                                onClick={() => handleAnswerQuestion(question)}
                                className="w-full"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {question.answer_status === 'returned' ? 'Düzelt' : 'Yanıtla'}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewQuestion(question)}
                                className="w-full"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Görüntüle
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default YdoSecureAccess;
