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
    console.log('=== COMPONENT MOUNT ===');
    
    // Enhanced debugging for mobile
    const debugData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
      screenInfo: {
        width: window.screen.width,
        height: window.screen.height,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1
      },
      locationInfo: {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      },
      supabaseStatus: {
        clientExists: !!supabase,
        url: 'https://zyxiznikuvpwmopraauj.supabase.co'
      }
    };
    
    setDebugInfo(debugData);
    console.log('Mobile Debug Data:', debugData);
    
    // Token extraction and verification
    const token = searchParams.get('token');
    console.log('=== TOKEN EXTRACTION ===');
    console.log('Raw token from URL:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      searchParams: window.location.search,
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    if (!token) {
      console.error('No token found in URL parameters');
      toast.error('Erişim anahtarı gerekli');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    console.log('=== STARTING TOKEN VERIFICATION ===');
    const payload = verifyYdoToken(token);
    
    if (!payload) {
      console.error('Token verification failed - payload is null');
      toast.error('Geçersiz veya süresi dolmuş erişim anahtarı');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    console.log('=== TOKEN VERIFIED SUCCESSFULLY ===');
    console.log('Setting token data:', payload);
    setTokenData(payload);
    
    // Load questions with the verified province
    console.log('=== LOADING QUESTIONS FOR PROVINCE ===', payload.province);
    loadQuestions(payload.province);
  }, [searchParams, navigate]);

  const loadQuestions = async (province: string) => {
    console.log('=== LOAD QUESTIONS START ===');
    console.log('Province parameter:', {
      value: province,
      type: typeof province,
      length: province?.length,
      charCodes: Array.from(province).map(char => char.charCodeAt(0)),
      normalized: province?.trim().toLowerCase()
    });
    
    try {
      const startTime = Date.now();
      
      // First, let's check what provinces exist in the database
      console.log('=== CHECKING ALL PROVINCES IN DATABASE ===');
      const { data: allQuestions, error: allError } = await supabase
        .from('soru_cevap')
        .select('province, id, question')
        .limit(20);

      if (allError) {
        console.error('Error fetching sample data:', allError);
      } else {
        console.log('ALL PROVINCES IN DATABASE:', allQuestions?.map(q => ({
          province: q.province,
          id: q.id,
          charCodes: Array.from(q.province).map(char => char.charCodeAt(0))
        })));
        
        // Check for exact matches
        const exactMatches = allQuestions?.filter(q => q.province === province) || [];
        console.log('EXACT MATCHES FOUND:', exactMatches.length);
      }
      
      // Try multiple query strategies with better error handling
      let finalData: any[] = [];
      let querySuccess = false;
      
      // Strategy 1: Explicit exact match
      console.log('=== STRATEGY 1: EXACT MATCH ===');
      try {
        const { data: exactData, error: exactError } = await supabase
          .from('soru_cevap')
          .select('*')
          .eq('province', province)
          .order('created_at', { ascending: false });

        console.log('Exact match query result:', { 
          count: exactData?.length || 0, 
          error: exactError,
          sample: exactData?.slice(0, 2) 
        });

        if (!exactError && exactData && exactData.length > 0) {
          finalData = exactData;
          querySuccess = true;
          console.log('SUCCESS: Exact match found');
        }
      } catch (err) {
        console.error('Exact match query failed:', err);
      }

      // Strategy 2: Case-insensitive search
      if (!querySuccess) {
        console.log('=== STRATEGY 2: CASE INSENSITIVE ===');
        try {
          const { data: iLikeData, error: iLikeError } = await supabase
            .from('soru_cevap')
            .select('*')
            .ilike('province', province)
            .order('created_at', { ascending: false });

          console.log('Case-insensitive query result:', { 
            count: iLikeData?.length || 0, 
            error: iLikeError 
          });

          if (!iLikeError && iLikeData && iLikeData.length > 0) {
            finalData = iLikeData;
            querySuccess = true;
            console.log('SUCCESS: Case-insensitive match found');
          }
        } catch (err) {
          console.error('Case-insensitive query failed:', err);
        }
      }

      // Strategy 3: Partial match
      if (!querySuccess) {
        console.log('=== STRATEGY 3: PARTIAL MATCH ===');
        try {
          const { data: partialData, error: partialError } = await supabase
            .from('soru_cevap')
            .select('*')
            .ilike('province', `%${province}%`)
            .order('created_at', { ascending: false });

          console.log('Partial match query result:', { 
            count: partialData?.length || 0, 
            error: partialError 
          });

          if (!partialError && partialData && partialData.length > 0) {
            finalData = partialData;
            querySuccess = true;
            console.log('SUCCESS: Partial match found');
          }
        } catch (err) {
          console.error('Partial match query failed:', err);
        }
      }

      // Strategy 4: Get ALL data and filter manually (last resort)
      if (!querySuccess) {
        console.log('=== STRATEGY 4: MANUAL FILTER (LAST RESORT) ===');
        try {
          const { data: allData, error: allDataError } = await supabase
            .from('soru_cevap')
            .select('*')
            .order('created_at', { ascending: false });

          if (!allDataError && allData) {
            console.log('Got all data, filtering manually. Total records:', allData.length);
            
            // Try different comparison methods
            const manualFiltered = allData.filter(item => {
              const itemProvince = item.province;
              return itemProvince === province || 
                     itemProvince.toLowerCase() === province.toLowerCase() ||
                     itemProvince.includes(province) ||
                     province.includes(itemProvince);
            });
            
            console.log('Manual filter result:', manualFiltered.length);
            
            if (manualFiltered.length > 0) {
              finalData = manualFiltered;
              querySuccess = true;
              console.log('SUCCESS: Manual filtering found matches');
            }
          }
        } catch (err) {
          console.error('Manual filter query failed:', err);
        }
      }

      const endTime = Date.now();
      
      console.log('=== FINAL QUERY RESULT ===');
      console.log('Query duration:', endTime - startTime, 'ms');
      console.log('Query success:', querySuccess);
      console.log('Final data count:', finalData.length);
      console.log('Final data sample:', finalData.slice(0, 2));

      // Type the data correctly
      const typedData = finalData.map(item => ({
        ...item,
        answer_status: item.answer_status as Question['answer_status']
      }));
      
      console.log('=== SETTING QUESTIONS STATE ===');
      console.log('Setting questions count:', typedData.length);
      
      setQuestions(typedData);
      
      // Final success/failure logging
      if (typedData.length > 0) {
        console.log('✅ SUCCESS: Questions loaded for mobile');
        toast.success(`${typedData.length} soru yüklendi`);
      } else {
        console.log('❌ NO QUESTIONS FOUND after all strategies');
        toast.error('Bu il için soru bulunamadı');
      }
      
    } catch (error) {
      console.error('=== LOAD QUESTIONS CRITICAL ERROR ===');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      toast.error('Sorular yüklenirken hata oluştu');
    } finally {
      console.log('=== SETTING LOADING FALSE ===');
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

  console.log('=== RENDER ===');
  console.log('Loading state:', loading);
  console.log('Questions count:', questions.length);
  console.log('Token data:', tokenData);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Sorular yükleniyor...</p>
          
          {/* Enhanced mobile debug panel */}
          {debugInfo && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left text-xs space-y-2">
              <div className="font-semibold text-blue-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Debug Bilgileri
              </div>
              <div className="text-blue-700 space-y-1">
                <p><strong>Platform:</strong> {debugInfo.isMobile ? 'Mobil' : 'Masaüstü'}</p>
                <p><strong>Ekran:</strong> {debugInfo.screenInfo.width}x{debugInfo.screenInfo.height}</p>
                <p><strong>İç Boyut:</strong> {debugInfo.screenInfo.innerWidth}x{debugInfo.screenInfo.innerHeight}</p>
                <p><strong>Pixel Oranı:</strong> {debugInfo.screenInfo.devicePixelRatio}</p>
                <p><strong>İl:</strong> {tokenData?.province || 'Yükleniyor...'}</p>
                <p><strong>Supabase:</strong> Aktif</p>
                <p><strong>URL:</strong> {debugInfo.locationInfo.href.substring(0, 60)}...</p>
              </div>
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
            
            {/* Critical Mobile Debug Panel */}
            {/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Kritik Debug Paneli</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-yellow-700">
                  <div><strong>✅ Token İli:</strong> "{tokenData?.province}" (Uzunluk: {tokenData?.province?.length})</div>
                  <div><strong>📊 Bulunan Soru:</strong> {questions.length}</div>
                  <div><strong>🔍 Supabase Bağlantı:</strong> {supabase ? 'Aktif' : 'Pasif'}</div>
                  <div><strong>📱 Platform:</strong> {debugInfo?.isMobile ? 'Mobil' : 'Masaüstü'}</div>
                  <div><strong>🕒 Yükleme:</strong> {loading ? 'Devam Ediyor' : 'Tamamlandı'}</div>
                </div>
                
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  <strong>🚨 HATA DURUMU:</strong> 
                  {questions.length === 0 && !loading && (
                    <div>Soru bulunamadı! Konsol loglarını kontrol edin. İl adı veritabanındaki ile tam olarak eşleşmiyor olabilir.</div>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-2">Henüz soru bulunmamaktadır.</p>
                <p className="text-sm text-gray-400">İl: {tokenData?.province}</p>
                
                {/* Critical mobile no-questions debug */}
                {/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-left max-w-md mx-auto">
                    <div className="font-semibold text-red-800 mb-2">🔍 Detaylı Tanı:</div>
                    <div className="text-red-700 space-y-1">
                      <p><strong>URL Parametresi:</strong> {window.location.search}</p>
                      <p><strong>Token İl Değeri:</strong> "{tokenData?.province}"</p>
                      <p><strong>Karakter Kodları:</strong> {tokenData?.province ? Array.from(tokenData.province).map(c => c.charCodeAt(0)).join(',') : 'N/A'}</p>
                      <p><strong>Token Email:</strong> {tokenData?.email}</p>
                      <p><strong>Loading Durumu:</strong> {loading ? 'Yükleniyor' : 'Tamamlandı'}</p>
                      <p><strong>Supabase URL:</strong> https://zyxiznikuvpwmopraauj.supabase.co</p>
                      <p><strong>Tarayıcı:</strong> {navigator.userAgent.substring(0, 50)}...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile-first card layout */}
                <div className="block sm:hidden space-y-4">
                  {questions.map((question) => (
                    <Card key={question.id} className="border border-gray-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-medium text-sm text-gray-900">{question.full_name}</h3>
                              {getStatusBadge(question)}
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{question.email}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(question.created_at)}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded border">
                            <p className="text-sm line-clamp-3">
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
