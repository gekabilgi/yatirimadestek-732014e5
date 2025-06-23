import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, Edit, Send, AlertCircle, Smartphone, Monitor, Clock, User, Mail, Bug, Wifi, Database, Key, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { verifyYdoToken, decodeTokenSafe, type YdoTokenPayload } from '@/utils/tokenUtils';
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
  const [mobileDebugLogs, setMobileDebugLogs] = useState<string[]>([]);
  const [showDetailedDebug, setShowDetailedDebug] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'failed' | 'unknown'>('unknown');
  const [detailedError, setDetailedError] = useState<string>('');

  // Mobile debugging helper
  const addMobileLog = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setMobileDebugLogs(prev => [...prev.slice(-25), logEntry]); // Keep last 25 logs
    console.log(`📱 MOBILE DEBUG: ${logEntry}`);
  };

  // Enhanced connection testing
  const testDatabaseConnection = async () => {
    addMobileLog('🔍 Starting comprehensive connection test...', 'info');
    setConnectionStatus('testing');
    
    try {
      // Test basic Supabase connectivity
      addMobileLog('Testing Supabase connectivity...', 'info');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addMobileLog(`Session check error: ${sessionError.message}`, 'warning');
      } else {
        addMobileLog(`Session status: ${session ? 'Active' : 'None (expected for YDO)'}`, 'info');
      }
      
      setConnectionStatus('success');
      addMobileLog('✅ Basic connection test passed', 'success');
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      addMobileLog(`Connection test failed: ${errorMessage}`, 'error');
      setDetailedError(errorMessage);
      setConnectionStatus('failed');
      return false;
    }
  };

  useEffect(() => {
    const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
    
    addMobileLog(`=== YDO SECURE ACCESS INIT ===`, 'info');
    addMobileLog(`Device: ${isMobile ? 'Mobile' : 'Desktop'}`, 'info');
    addMobileLog(`Screen: ${window.screen.width}x${window.screen.height}`, 'info');
    addMobileLog(`Window: ${window.innerWidth}x${window.innerHeight}`, 'info');
    addMobileLog(`User Agent: ${navigator.userAgent}`, 'info');
    addMobileLog(`Current URL: ${window.location.href}`, 'info');
    addMobileLog(`Local time: ${new Date().toLocaleString()}`, 'info');
    
    // URL Analysis
    const token = searchParams.get('token');
    
    addMobileLog(`URL Search Params: ${window.location.search}`, 'info');
    addMobileLog(`Token exists: ${!!token}`, token ? 'success' : 'error');
    addMobileLog(`Token length: ${token?.length || 0}`, 'info');
    
    if (token) {
      addMobileLog(`Token preview: ${token.substring(0, 20)}...`, 'info');
      addMobileLog(`Token ends with: ...${token.slice(-10)}`, 'info');
    }
    
    if (!token) {
      addMobileLog('No token found in URL - redirecting to home', 'error');
      toast.error('Erişim anahtarı gerekli');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    addMobileLog('Starting token verification with safe decoder...', 'info');
    const payload = verifyYdoToken(token);
    
    if (!payload) {
      addMobileLog('Token verification failed', 'error');
      toast.error('Geçersiz veya süresi dolmuş erişim anahtarı');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    addMobileLog(`Token verified successfully for province: "${payload.province}"`, 'success');
    addMobileLog(`Province length: ${payload.province?.length}`, 'info');
    addMobileLog(`Token expiry: ${new Date(payload.exp * 1000).toLocaleString()}`, 'info');
    
    setTokenData(payload);
    
    // Start connection test and then load questions
    testDatabaseConnection().then((connectionOk) => {
      if (connectionOk) {
        loadQuestions(token, isMobile);
      } else {
        addMobileLog('Skipping question load due to connection failure', 'error');
        setLoading(false);
      }
    });
  }, [searchParams, navigate]);

  const loadQuestions = async (token: string, isMobile: boolean = false) => {
    addMobileLog('=== STARTING QUESTION LOAD VIA EDGE FUNCTION ===', 'info');
    
    const debugData: any = {
      startTime: Date.now(),
      isMobile,
      userAgent: navigator.userAgent,
      networkStatus: navigator.onLine ? 'Online' : 'Offline',
      connectionTest: connectionStatus
    };
    
    try {
      addMobileLog('Calling edge function to fetch questions...', 'info');
      
      const { data, error } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'fetch_ydo_questions',
          token: token
        }
      });

      if (error) {
        addMobileLog(`Edge function error: ${JSON.stringify(error)}`, 'error');
        throw error;
      }

      if (!data.success) {
        addMobileLog(`Edge function failed: ${data.error}`, 'error');
        throw new Error(data.error);
      }

      const fetchedQuestions = data.questions || [];
      addMobileLog(`SUCCESS: Loaded ${fetchedQuestions.length} questions via edge function`, 'success');
      
      const typedData = fetchedQuestions.map((item: any) => ({
        ...item,
        answer_status: item.answer_status as Question['answer_status']
      }));
      
      setQuestions(typedData);
      setDebugInfo(debugData);
      toast.success(`${typedData.length} soru yüklendi`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMobileLog(`CRITICAL ERROR in loadQuestions: ${errorMessage}`, 'error');
      debugData.criticalError = error;
      setDebugInfo(debugData);
      toast.error('Sorular yüklenirken hata oluştu');
      setQuestions([]);
    } finally {
      setLoading(false);
      addMobileLog('=== QUESTION LOAD PROCESS ENDED ===', 'info');
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
      
      addMobileLog(`Submitting ${isCorrection ? 'correction' : 'answer'} via edge function...`, 'info');

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
        addMobileLog(`Answer submission error: ${JSON.stringify(error)}`, 'error');
        throw error;
      }

      if (!data.success) {
        addMobileLog(`Answer submission failed: ${data.error}`, 'error');
        throw new Error(data.error);
      }

      const successMessage = isCorrection 
        ? 'Düzeltilmiş yanıt başarıyla gönderildi'
        : 'Yanıt başarıyla gönderildi';
      
      addMobileLog(`Answer submitted successfully: ${successMessage}`, 'success');
      toast.success(successMessage);
      setSelectedQuestion(null);
      setAnswer('');
      
      if (token) {
        loadQuestions(token, /Mobile|Android|iPhone|iPad/.test(navigator.userAgent));
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      addMobileLog(`Error submitting answer: ${error}`, 'error');
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
          
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-lg text-left text-xs max-h-96 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-blue-800">Mobil Debug Konsolu</span>
            </div>
            
            <div className="mb-4 p-2 border-2 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-3 w-3" />
                <span className="font-semibold text-blue-800">Bağlantı Durumu</span>
              </div>
              <div className={`text-sm ${
                connectionStatus === 'success' ? 'text-green-600' : 
                connectionStatus === 'failed' ? 'text-red-600' : 
                connectionStatus === 'testing' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {connectionStatus === 'testing' && '🔄 Test ediliyor...'}
                {connectionStatus === 'success' && '✅ Bağlantı başarılı'}
                {connectionStatus === 'failed' && '❌ Bağlantı başarısız'}
                {connectionStatus === 'unknown' && '❓ Bilinmiyor'}
              </div>
              {detailedError && (
                <div className="text-red-600 text-xs mt-1 p-1 bg-red-50 rounded">
                  <strong>Hata:</strong> {detailedError}
                </div>
              )}
            </div>

            <div className="space-y-1 mb-4 max-h-48 overflow-y-auto bg-white p-2 rounded border">
              <div className="font-semibold text-blue-800 mb-1">🔧 Canlı Loglar:</div>
              {mobileDebugLogs.slice(-10).map((log, index) => {
                const logType = log.includes('ERROR') ? 'text-red-600' : 
                               log.includes('SUCCESS') ? 'text-green-600' : 
                               log.includes('WARNING') ? 'text-yellow-600' : 'text-blue-600';
                return (
                  <div key={index} className={`text-xs ${logType} font-mono`}>
                    {log.length > 80 ? log.substring(0, 80) + '...' : log}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border">
                <div className="flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  <span className="font-semibold">Token</span>
                </div>
                <div className={tokenData ? 'text-green-600' : 'text-red-600'}>
                  {tokenData ? '✅ Geçerli' : '❌ Bekliyor'}
                </div>
              </div>
              
              <div className="bg-white p-2 rounded border">
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span className="font-semibold">İl</span>
                </div>
                <div className="text-blue-600 text-xs">
                  {tokenData?.province || 'Bekleniyor...'}
                </div>
              </div>
              
              <div className="bg-white p-2 rounded border">
                <div className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  <span className="font-semibold">Ağ</span>
                </div>
                <div className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
                  {navigator.onLine ? '✅ Çevrimiçi' : '❌ Çevrimdışı'}
                </div>
              </div>
              
              <div className="bg-white p-2 rounded border">
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span className="font-semibold">Edge Func</span>
                </div>
                <div className="text-blue-600">
                  {connectionStatus === 'success' ? '✅ Hazır' : '⏳ Test'}
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetailedDebug(!showDetailedDebug)}
              className="mt-2 text-xs h-6 w-full"
            >
              {showDetailedDebug ? 'Detayları Gizle' : 'Tüm Logları Göster'}
            </Button>

            {showDetailedDebug && (
              <div className="mt-2 p-2 bg-white border rounded text-xs max-h-48 overflow-y-auto">
                <div className="font-semibold mb-1">Tüm Debug Logları:</div>
                {mobileDebugLogs.map((log, index) => {
                  const logType = log.includes('ERROR') ? 'text-red-600' : 
                                 log.includes('SUCCESS') ? 'text-green-600' : 
                                 log.includes('WARNING') ? 'text-yellow-600' : 'text-blue-700';
                  return (
                    <div key={index} className={`${logType} mb-1 font-mono text-xs`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
                    <strong>🔐 Token Durumu:</strong> {tokenData ? '✅ Geçerli (Edge Function)' : '❌ Geçersiz'}
                  </div>
                  <div className="text-blue-700">
                    <strong>🌐 Ağ Durumu:</strong> {navigator.onLine ? '✅ Çevrimiçi' : '❌ Çevrimdışı'}
                  </div>
                  <div className="text-blue-700">
                    <strong>💾 Edge Function:</strong> {
                      connectionStatus === 'success' ? '✅ Çalışıyor' : 
                      connectionStatus === 'failed' ? '❌ Hata' : 
                      connectionStatus === 'testing' ? '🔄 Test ediliyor' : '❓ Bilinmiyor'
                    }
                  </div>
                  
                  {connectionStatus === 'failed' && detailedError && (
                    <div className="text-red-700 bg-red-50 p-2 rounded text-xs">
                      <strong>Bağlantı Hatası:</strong> {detailedError}
                    </div>
                  )}
                  
                  <div className="mt-3 p-3 bg-white border border-blue-200 rounded text-xs max-h-32 overflow-y-auto">
                    <div className="font-semibold text-blue-800 mb-2">🔧 Son Debug Logları:</div>
                    {mobileDebugLogs.slice(-8).map((log, index) => {
                      const logType = log.includes('ERROR') ? 'text-red-600' : 
                                     log.includes('SUCCESS') ? 'text-green-600' : 
                                     log.includes('WARNING') ? 'text-yellow-600' : 'text-blue-700';
                      return (
                        <div key={index} className={`${logType} mb-1 font-mono`}>
                          {log.length > 70 ? log.substring(0, 70) + '...' : log}
                        </div>
                      );
                    })}
                  </div>

                  {questions.length === 0 && !loading && connectionStatus === 'failed' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                      <strong>⚠️ SORUN:</strong> Edge function bağlantısı başarısız. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {connectionStatus === 'failed' ? 'Bağlantı Hatası' : 'Soru Bulunamadı'}
                </h3>
                <p className="text-gray-500 mb-1">
                  {connectionStatus === 'failed' 
                    ? 'Edge function\'a bağlantı kurulamadı' 
                    : `İl: "${tokenData?.province}"`
                  }
                </p>
                <p className="text-sm text-gray-400">
                  {connectionStatus === 'failed' 
                    ? 'Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin'
                    : 'Henüz bu il için soru gelmemiş olabilir.'
                  }
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
