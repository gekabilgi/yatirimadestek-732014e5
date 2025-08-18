
/**
 * SECURITY NOTE: This component now uses the secure public_qna_view instead of 
 * direct access to the soru_cevap table. The view excludes ALL personal data
 * (names, emails, phone numbers) to protect customer privacy while still 
 * providing public access to approved Q&A content.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Calendar, MapPin, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/qna';

const AnsweredQuestionsSection = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [totalAnsweredCount, setTotalAnsweredCount] = useState(0);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnsweredQuestions();
    fetchTotalAnsweredCount();
  }, []);

  const fetchAnsweredQuestions = async () => {
    try {
      // SECURITY FIX: Use secure view instead of direct table access
      // This prevents exposure of personal data (names, emails, phones)
      const { data, error } = await supabase
        .from('public_qna_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching answered questions:', error);
        return;
      }

      // Transform the secure view data to match the expected Question type
      const transformedData = data?.map(item => ({
        ...item,
        // Personal data fields are intentionally excluded from the secure view
        full_name: 'Anonim Kullanıcı', // Anonymous user for privacy
        email: 'Gizli', // Hidden for privacy
        phone: null,
        answered: true,
        sent_to_user: true,
        sent_to_ydo: true,
        answer_status: 'approved' as const,
        return_status: null,
        admin_notes: null,
        answered_by_user_id: null,
        approved_by_admin_id: null,
        return_reason: null,
        admin_sent: null,
        return_date: null,
        answered_by_full_name: null
      })) || [];

      setQuestions(transformedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalAnsweredCount = async () => {
    try {
      // SECURITY FIX: Use secure view for count to avoid exposing personal data
      const { count, error } = await supabase
        .from('public_qna_view')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching count:', error);
        return;
      }

      setTotalAnsweredCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleExpanded = (questionId: string) => {
    setExpandedCard(expandedCard === questionId ? null : questionId);
  };

  const toggleAnswerExpansion = (questionId: string) => {
    setExpandedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Yanıtlanmış sorular yükleniyor...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Yanıtlanmış 
            <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              {" "}Sorular
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Daha önce uzmanlarımız tarafından yanıtlanmış soruları inceleyin. 
            Aradığınız bilgiyi burada bulabilirsiniz.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Sorularda ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg border-2 border-gray-200 focus:border-primary rounded-xl"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="text-center mb-6">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {searchTerm ? `${filteredQuestions.length} sonuç bulundu` : `${totalAnsweredCount} yanıtlanmış soru bulundu`}
            </Badge>
          </div>
        </div>

        {/* Questions List */}
        <div className="max-w-4xl mx-auto space-y-6">
          {filteredQuestions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Arama kriterlerinize uygun soru bulunamadı' : 'Henüz yanıtlanmış soru bulunmuyor'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Farklı anahtar kelimeler deneyebilirsiniz.' : 'İlk soruları yanıtladığımızda burada görünecekler.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question) => (
              <Card key={question.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{question.province}</span>
                        <Badge variant="secondary" className="text-xs">
                          Yanıtlandı
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(question.created_at)}</span>
                        {question.answer_date && (
                          <>
                            <span>•</span>
                            <span>Yanıtlanma: {formatDate(question.answer_date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Question */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        Soru
                      </h3>
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <p className="text-gray-800 leading-relaxed">
                          {expandedCard === question.id || question.question.length <= 200
                            ? question.question
                            : `${question.question.substring(0, 200)}...`}
                        </p>
                        {question.question.length > 200 && (
                          <button
                            onClick={() => toggleExpanded(question.id)}
                            className="mt-2 text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                          >
                            {expandedCard === question.id ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Daha az göster
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Devamını oku
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Answer */}
                    {question.answer && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                          Cevap
                        </h3>
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                          <div className="relative">
                            <p className={`text-gray-800 leading-relaxed whitespace-pre-wrap ${
                              expandedAnswers.has(question.id) ? '' : 'line-clamp-2'
                            }`}>
                              {question.answer}
                            </p>
                            {question.answer.length > 150 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAnswerExpansion(question.id)}
                                className="mt-2 text-green-700 hover:text-green-800 hover:bg-green-100 p-1 h-auto font-medium"
                              >
                                {expandedAnswers.has(question.id) ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    Daha az göster
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    Devamını oku
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Call to Action */}
        
      </div>
    </section>
  );
};

export default AnsweredQuestionsSection;
