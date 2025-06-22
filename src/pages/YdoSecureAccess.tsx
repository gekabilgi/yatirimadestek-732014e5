import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, Edit, Send, AlertCircle } from 'lucide-react';
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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Enhanced mobile debugging
    const debugData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      },
      location: {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search
      }
    };
    
    setDebugInfo(debugData);
    console.log('YdoSecureAccess Debug Info:', debugData);
    
    const token = searchParams.get('token');
    console.log('Token extraction:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      searchParamsString: window.location.search,
      allSearchParams: Object.fromEntries(searchParams.entries())
    });
    
    if (!token) {
      console.error('No token provided in URL');
      console.log('Current URL breakdown:', {
        fullUrl: window.location.href,
        search: window.location.search,
        hash: window.location.hash
      });
      
      toast.error('Erişim anahtarı gerekli');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    console.log('Attempting token verification...');
    const payload = verifyYdoToken(token);
    console.log('Token verification completed:', {
      success: !!payload,
      payload: payload
    });
    
    if (!payload) {
      console.error('Token verification failed');
      toast.error('Geçersiz veya süresi dolmuş erişim anahtarı');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    console.log('Token verified successfully, loading questions...');
    setTokenData(payload);
    loadQuestions(payload.province);
  }, [searchParams, navigate]);

  const loadQuestions = async (province: string) => {
    try {
      console.log('=== LOADING QUESTIONS ===');
      console.log('Province:', province);
      console.log('Supabase client status:', !!supabase);
      
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('soru_cevap')
        .select('*')
        .eq('province', province)
        .order('created_at', { ascending: false });

      const endTime = Date.now();
      console.log('Query completed in:', endTime - startTime, 'ms');
      console.log('Query result:', {
        error: error,
        dataCount: data?.length || 0,
        data: data
      });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      // Cast answer_status to the correct type
      const typedData = (data || []).map(item => ({
        ...item,
        answer_status: item.answer_status as Question['answer_status']
      }));
      
      console.log('Setting questions state with:', typedData.length, 'questions');
      setQuestions(typedData);
      
      // Additional mobile-specific logging
      if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
        console.log('MOBILE DEBUG - Questions loaded:', {
          count: typedData.length,
          questions: typedData.map(q => ({
            id: q.id,
            question: q.question.substring(0, 50),
            status: q.answer_status
          }))
        });
      }
      
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Sorular yüklenirken hata oluştu');
    } finally {
      console.log('Setting loading to false');
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
    if (!selectedQuestion || !answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);

    try {
      // Determine the new status based on current status
      const newStatus = selectedQuestion.answer_status === 'returned' ? 'corrected' : 'answered';

      // Update the question with the answer
      const { error: updateError } = await supabase
        .from('soru_cevap')
        .update({
          answer: answer.trim(),
          answered: true,
          answer_date: new Date().toISOString(),
          answered_by_user_id: null, // YDO user doesn't have user_id in this flow
          answer_status: newStatus,
          admin_sent: false // Reset admin_sent when answer is updated
        })
        .eq('id', selectedQuestion.id);

      if (updateError) throw updateError;

      // Send notification that answer was provided/corrected
      const { error: notificationError } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: newStatus === 'corrected' ? 'answer_corrected' : 'answer_provided',
          questionData: {
            ...selectedQuestion,
            answer: answer.trim(),
            answer_status: newStatus
          }
        }
      });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      const successMessage = newStatus === 'corrected' 
        ? 'Düzeltilmiş yanıt başarıyla gönderildi'
        : 'Yanıt başarıyla gönderildi';
      
      toast.success(successMessage);
      setSelectedQuestion(null);
      setAnswer('');
      
      // Reload questions to reflect changes
      if (tokenData) {
        loadQuestions(tokenData.province);
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

  const canEditAnswer = (question: Question) => {
    return question.answer_status === 'unanswered' || question.answer_status === 'returned';
  };

  console.log('Rendering component - loading:', loading, 'questions count:', questions.length);

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Sorular yükleniyor...</p>
          {debugInfo && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left text-xs">
              <p className="font-semibold mb-2">Debug Bilgileri:</p>
              <p>Platform: {debugInfo.isMobile ? 'Mobil' : 'Masaüstü'}</p>
              <p>Ekran: {debugInfo.screenSize.width}x{debugInfo.screenSize.height}</p>
              <p>İl: {tokenData?.province || 'Yükleniyor...'}</p>
            </div>
          )}
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
                <div className="bg-blue-50 border border-blue-200 rounde-lg p-4">
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

  console.log('Rendering main questions list view for mobile check');

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-2xl">
              YDO Soru Yanıtlama Paneli - {tokenData?.province}
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600">
              {tokenData?.province} ili için gelen sorular ve yanıtlama işlemleri
            </p>
            
            {/* Mobile Debug Panel */}
            {/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Mobil Debug</span>
                </div>
                <div className="space-y-1 text-yellow-700">
                  <p>Soru Sayısı: {questions.length}</p>
                  <p>Platform: {debugInfo?.isMobile ? 'Mobil' : 'Masaüstü'}</p>
                  <p>Ekran: {debugInfo?.screenSize.innerWidth}x{debugInfo?.screenSize.innerHeight}</p>
                  <p>Token: {tokenData ? 'Geçerli' : 'Geçersiz'}</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Henüz soru bulunmamaktadır.</p>
                <p className="text-sm text-gray-400 mt-2">İl: {tokenData?.province}</p>
                {/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-left">
                    <p className="font-semibold mb-2">Mobil Tanılama:</p>
                    <p>URL: {window.location.href.substring(0, 100)}...</p>
                    <p>Supabase Bağlantısı: {supabase ? 'Aktif' : 'Pasif'}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile-first card layout for small screens */}
                <div className="block sm:hidden space-y-4">
                  {questions.map((question) => (
                    <Card key={question.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-medium text-sm">{question.full_name}</h3>
                              {getStatusBadge(question)}
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{question.email}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(question.created_at)}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="line-clamp-3">
                              {question.question.length > 150
                                ? `${question.question.substring(0, 150)}...`
                                : question.question}
                            </p>
                          </div>
                          
                          {question.answer_date && (
                            <p className="text-xs text-gray-500">
                              Yanıt Tarihi: {formatDate(question.answer_date)}
                            </p>
                          )}
                          
                          <div className="pt-2">
                            {canEditAnswer(question) ? (
                              <Button
                                size="sm"
                                onClick={() => handleAnswerQuestion(question)}
                                className="w-full"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {question.answer_status === 'returned' ? 'Düzelt' : 'Yanıtla'}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewQuestion(question)}
                                className="w-full"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Görüntüle
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop table layout */}
                <div className="hidden sm:block">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Soru</TableHead>
                          <TableHead className="min-w-[150px]">Ad Soyad</TableHead>
                          <TableHead className="min-w-[200px]">E-posta</TableHead>
                          <TableHead className="min-w-[120px]">Tarih</TableHead>
                          <TableHead className="min-w-[100px]">Durum</TableHead>
                          <TableHead className="min-w-[120px]">Yanıt Tarihi</TableHead>
                          <TableHead className="min-w-[120px]">İşlemler</TableHead>
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
                            <TableCell className="break-all">{question.email}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(question.created_at)}</TableCell>
                            <TableCell>{getStatusBadge(question)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {question.answer_date ? formatDate(question.answer_date) : '-'}
                            </TableCell>
                            <TableCell>
                              {canEditAnswer(question) ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleAnswerQuestion(question)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  {question.answer_status === 'returned' ? 'Düzelt' : 'Yanıtla'}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewQuestion(question)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Görüntüle
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
