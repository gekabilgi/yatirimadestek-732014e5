import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    console.log('🚀 MOBILE YDO ACCESS - COMPONENT MOUNT');
    
    const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
    console.log('📱 Device detection:', {
      isMobile,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      windowWidth: window.innerWidth
    });
    
    const token = searchParams.get('token');
    console.log('🔑 Token extraction:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      urlSearch: window.location.search,
      fullUrl: window.location.href
    });
    
    if (!token) {
      console.error('❌ No token in URL');
      toast.error('Erişim anahtarı gerekli');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    console.log('🔐 Starting token verification...');
    const payload = verifyYdoToken(token);
    
    if (!payload) {
      console.error('❌ Token verification failed');
      toast.error('Geçersiz veya süresi dolmuş erişim anahtarı');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    console.log('✅ Token verified, loading questions for:', payload.province);
    setTokenData(payload);
    loadQuestions(payload.province, isMobile);
  }, [searchParams, navigate]);

  const loadQuestions = async (province: string, isMobile: boolean = false) => {
    console.log('🔍 ===========================================');
    console.log('📊 LOADING QUESTIONS - DETAILED MOBILE DEBUG');
    console.log('🔍 ===========================================');
    
    const debugData: any = {
      startTime: Date.now(),
      province,
      isMobile,
      userAgent: navigator.userAgent,
      queries: []
    };
    
    console.log('🎯 Query parameters:', {
      targetProvince: province,
      provinceType: typeof province,
      provinceLength: province?.length,
      provinceBytes: new TextEncoder().encode(province).length,
      isMobile,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Strategy 1: Direct exact match with detailed logging
      console.log('🔍 STRATEGY 1: Direct exact match');
      console.log('🔧 Query details:', {
        table: 'soru_cevap',
        filter: `province = "${province}"`,
        exactMatch: true
      });
      
      const directStart = Date.now();
      const { data: directData, error: directError, count: directCount } = await supabase
        .from('soru_cevap')
        .select('*', { count: 'exact' })
        .eq('province', province)
        .order('created_at', { ascending: false });

      const directDuration = Date.now() - directStart;
      console.log('📈 Strategy 1 result:', {
        success: !directError,
        count: directData?.length || 0,
        totalCount: directCount,
        duration: `${directDuration}ms`,
        error: directError?.message,
        hasData: !!directData,
        firstRowSample: directData?.[0] ? {
          id: directData[0].id,
          province: `"${directData[0].province}"`,
          provinceMatch: directData[0].province === province
        } : null
      });

      debugData.queries.push({
        strategy: 'direct',
        success: !directError,
        count: directData?.length || 0,
        duration: directDuration,
        error: directError?.message
      });

      if (!directError && directData && directData.length > 0) {
        console.log('✅ SUCCESS: Found questions with direct match');
        const typedData = directData.map(item => ({
          ...item,
          answer_status: item.answer_status as Question['answer_status']
        }));
        setQuestions(typedData);
        setDebugInfo(debugData);
        toast.success(`${typedData.length} soru yüklendi`);
        setLoading(false);
        return;
      }

      // Strategy 2: Case insensitive with detailed logging
      console.log('🔍 STRATEGY 2: Case insensitive search');
      console.log('🔧 Query details:', {
        table: 'soru_cevap',
        filter: `province ILIKE "%${province}%"`,
        caseInsensitive: true
      });

      const caseStart = Date.now();
      const { data: caseData, error: caseError, count: caseCount } = await supabase
        .from('soru_cevap')
        .select('*', { count: 'exact' })
        .ilike('province', province)
        .order('created_at', { ascending: false });

      const caseDuration = Date.now() - caseStart;
      console.log('📈 Strategy 2 result:', {
        success: !caseError,
        count: caseData?.length || 0,
        totalCount: caseCount,
        duration: `${caseDuration}ms`,
        error: caseError?.message,
        hasData: !!caseData,
        firstRowSample: caseData?.[0] ? {
          id: caseData[0].id,
          province: `"${caseData[0].province}"`,
        } : null
      });

      debugData.queries.push({
        strategy: 'case_insensitive',
        success: !caseError,
        count: caseData?.length || 0,
        duration: caseDuration,
        error: caseError?.message
      });

      if (!caseError && caseData && caseData.length > 0) {
        console.log('✅ SUCCESS: Found questions with case insensitive match');
        const typedData = caseData.map(item => ({
          ...item,
          answer_status: item.answer_status as Question['answer_status']
        }));
        setQuestions(typedData);
        setDebugInfo(debugData);
        toast.success(`${typedData.length} soru yüklendi`);
        setLoading(false);
        return;
      }

      // Strategy 3: Debug - check all provinces and exact matches
      console.log('🔍 STRATEGY 3: Full database inspection');
      const debugStart = Date.now();
      const { data: allData, error: allError } = await supabase
        .from('soru_cevap')
        .select('province, id, question, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const debugDuration = Date.now() - debugStart;
      console.log('📈 Strategy 3 result:', {
        success: !allError,
        totalRows: allData?.length || 0,
        duration: `${debugDuration}ms`,
        error: allError?.message
      });

      if (!allError && allData) {
        console.log('🗂️ DATABASE INSPECTION RESULTS:');
        const uniqueProvinces = [...new Set(allData.map(q => q.province))];
        console.log('🏛️ All unique provinces in DB:', uniqueProvinces);
        
        console.log('🔍 Province comparison analysis:');
        uniqueProvinces.forEach(dbProvince => {
          const exactMatch = dbProvince === province;
          const caseMatch = dbProvince.toLowerCase() === province.toLowerCase();
          console.log(`  - "${dbProvince}" vs "${province}": exact=${exactMatch}, case=${caseMatch}, length=${dbProvince.length}vs${province.length}`);
        });

        debugData.allProvinces = uniqueProvinces;
        debugData.targetProvince = province;
        
        // Check for any rows that might match
        const potentialMatches = allData.filter(q => 
          q.province.toLowerCase().includes(province.toLowerCase()) ||
          province.toLowerCase().includes(q.province.toLowerCase())
        );
        console.log('🎯 Potential matches found:', potentialMatches.length);
        if (potentialMatches.length > 0) {
          console.log('🎯 Potential matches:', potentialMatches.map(m => ({
            id: m.id,
            province: `"${m.province}"`,
            question: m.question.substring(0, 50) + '...'
          })));
        }
      }

      // Final attempt: Raw SQL with LIKE
      console.log('🔍 STRATEGY 4: Contains search');
      const containsStart = Date.now();
      const { data: containsData, error: containsError } = await supabase
        .from('soru_cevap')
        .select('*')
        .ilike('province', `%${province}%`)
        .order('created_at', { ascending: false });

      const containsDuration = Date.now() - containsStart;
      console.log('📈 Strategy 4 result:', {
        success: !containsError,
        count: containsData?.length || 0,
        duration: `${containsDuration}ms`,
        error: containsError?.message
      });

      debugData.queries.push({
        strategy: 'contains',
        success: !containsError,
        count: containsData?.length || 0,
        duration: containsDuration,
        error: containsError?.message
      });

      if (!containsError && containsData && containsData.length > 0) {
        console.log('✅ SUCCESS: Found questions with contains search');
        const typedData = containsData.map(item => ({
          ...item,
          answer_status: item.answer_status as Question['answer_status']
        }));
        setQuestions(typedData);
        setDebugInfo(debugData);
        toast.success(`${typedData.length} soru yüklendi`);
        setLoading(false);
        return;
      }

      debugData.totalDuration = Date.now() - debugData.startTime;
      setDebugInfo(debugData);

      console.log('❌ NO QUESTIONS FOUND - All strategies exhausted');
      console.log('📊 Final debug summary:', debugData);
      setQuestions([]);
      toast.error('Bu il için soru bulunamadı');
      
    } catch (error) {
      console.error('💥 CRITICAL ERROR in loadQuestions:', error);
      debugData.criticalError = error;
      setDebugInfo(debugData);
      toast.error('Sorular yüklenirken hata oluştu');
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
    if (!selectedQuestion || !answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);

    try {
      const newStatus = selectedQuestion.answer_status === 'returned' ? 'corrected' : 'answered';

      const { error: updateError } = await supabase
        .from('soru_cevap')
        .update({
          answer: answer.trim(),
          answered: true,
          answer_date: new Date().toISOString(),
          answered_by_user_id: null,
          answer_status: newStatus,
          admin_sent: false
        })
        .eq('id', selectedQuestion.id);

      if (updateError) throw updateError;

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
      
      if (tokenData) {
        loadQuestions(tokenData.province, /Mobile|Android|iPhone|iPad/.test(navigator.userAgent));
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

  console.log('🚀 RENDER');
  console.log('Loading state:', loading);
  console.log('Questions count:', questions.length);
  console.log('Token data:', tokenData);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Sorular yükleniyor...</p>
          
          {isMobile && (
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg text-left text-xs">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-blue-800">Mobil Debug Paneli</span>
              </div>
              <div className="space-y-2 text-blue-700">
                <p><strong>Cihaz:</strong> {navigator.userAgent.includes('iPhone') ? 'iPhone' : navigator.userAgent.includes('Android') ? 'Android' : 'Mobil'}</p>
                <p><strong>Ekran:</strong> {window.screen.width}x{window.screen.height}</p>
                <p><strong>İl:</strong> {tokenData?.province || 'Bekleniyor...'}</p>
                <p><strong>Token:</strong> {tokenData ? '✅ Geçerli' : '⏳ Kontrol ediliyor'}</p>
                <p><strong>Durum:</strong> Veritabanı sorgulanıyor...</p>
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
            
            {isMobile && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-blue-800">Mobil Debug Sonuçları</span>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="text-blue-700">
                    <strong>🎯 Aranan İl:</strong> "{tokenData?.province}" (uzunluk: {tokenData?.province?.length})
                  </div>
                  <div className="text-blue-700">
                    <strong>📊 Bulunan Soru:</strong> {questions.length}
                  </div>
                  <div className="text-blue-700">
                    <strong>🔐 Token Durumu:</strong> {tokenData ? '✅ Geçerli' : '❌ Geçersiz'}
                  </div>
                  <div className="text-blue-700">
                    <strong>📱 Tarayıcı:</strong> {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Diğer'}
                  </div>
                  
                  {debugInfo && (
                    <div className="mt-3 p-3 bg-white border border-blue-200 rounded text-xs">
                      <div className="font-semibold text-blue-800 mb-2">🔧 Sorgu Detayları:</div>
                      {debugInfo.queries?.map((query: any, index: number) => (
                        <div key={index} className="text-blue-700 mb-1">
                          <strong>{query.strategy}:</strong> {query.success ? `✅ ${query.count} sonuç` : `❌ ${query.error}`} ({query.duration}ms)
                        </div>
                      ))}
                      {debugInfo.allProvinces && (
                        <div className="mt-2">
                          <div className="font-semibold text-blue-800">DB'deki İller:</div>
                          <div className="text-blue-600 text-xs">{debugInfo.allProvinces.slice(0, 5).join(', ')}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {questions.length === 0 && !loading && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                    <strong>⚠️ SORUN:</strong> Hiçbir sorgu sonuç döndürmedi. Yukarıdaki sorgu detaylarını kontrol edin.
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Soru Bulunamadı</h3>
                <p className="text-gray-500 mb-1">İl: "{tokenData?.province}"</p>
                <p className="text-sm text-gray-400">Henüz bu il için soru gelmemiş olabilir.</p>
                
                {isMobile && debugInfo && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-left max-w-md mx-auto">
                    <div className="font-semibold text-yellow-800 mb-2">🔧 Detaylı Debug:</div>
                    <div className="text-yellow-700 space-y-1">
                      <p><strong>Toplam Sorgu:</strong> {debugInfo.queries?.length || 0}</p>
                      <p><strong>Toplam Süre:</strong> {debugInfo.totalDuration}ms</p>
                      <p><strong>DB'de İl Sayısı:</strong> {debugInfo.allProvinces?.length || 'Bilinmiyor'}</p>
                      <p>Chrome DevTools console'da tam detayları görün</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Unified responsive grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {questions.map((question) => (
                    <Card key={question.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header with name and status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <h3 className="font-medium text-sm text-gray-900 truncate">
                                {question.full_name}
                              </h3>
                            </div>
                            {getStatusBadge(question)}
                          </div>

                          {/* Email */}
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{question.email}</span>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDate(question.created_at)}</span>
                          </div>
                          
                          {/* Question preview */}
                          <div className="bg-gray-50 p-3 rounded border">
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {question.question.length > 120
                                ? `${question.question.substring(0, 120)}...`
                                : question.question}
                            </p>
                          </div>
                          
                          {/* Answer date if exists */}
                          {question.answer_date && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Yanıtlandı: {formatDate(question.answer_date)}
                            </div>
                          )}
                          
                          {/* Action button */}
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
