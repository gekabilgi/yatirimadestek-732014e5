/**
 * SECURITY NOTE: This component now uses the secure public_qna_view instead of 
 * direct access to the soru_cevap table. The view excludes ALL personal data
 * (names, emails, phone numbers) to protect customer privacy while still 
 * providing public access to approved Q&A content.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Calendar, MapPin, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/qna';
import { toast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 10;

type AnsweredQuestionsSectionProps = {
  headerAction?: React.ReactNode;
};

const AnsweredQuestionsSection = ({ headerAction }: AnsweredQuestionsSectionProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [totalAnsweredCount, setTotalAnsweredCount] = useState(0);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAnsweredQuestions();
    fetchTotalAnsweredCount();
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchAnsweredQuestions = async () => {
    try {
      console.log('🔍 Starting to fetch answered questions...');
      const { data, error } = await supabase.rpc('get_public_qna', { limit_count: 100 });

      if (error) {
        console.error('Error fetching answered questions:', error);
        toast({
          title: "Hata",
          description: `Sorular yüklenirken hata oluştu: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Raw data from get_public_qna:', data);

      const transformedData = data?.map(item => ({
        ...item,
        full_name: 'Anonim Kullanıcı',
        email: 'Gizli',
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
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Hata",
        description: `Beklenmeyen hata: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalAnsweredCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_qna_count');
      if (error) {
        console.error('Error fetching count:', error);
        return;
      }
      setTotalAnsweredCount(data || 0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of section
    const section = document.querySelector('[data-answered-section]');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50" data-answered-section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Yanıtlanmış sorular yükleniyor...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50" data-answered-section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                Yanıtlanmış
                <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                  {" "}Sorular
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl sm:max-w-none mx-auto sm:mx-0 mb-0">
                Daha önce uzmanlarımız tarafından yanıtlanmış soruları inceleyin.
                Aradığınız bilgiyi burada bulabilirsiniz.
              </p>
            </div>

            {headerAction ? (
              <div className="shrink-0 flex justify-center sm:justify-end pt-1">
                {headerAction}
              </div>
            ) : null}
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8 mt-8">
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
          {paginatedQuestions.length === 0 ? (
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
            paginatedQuestions.map((question) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </Button>
            
            <div className="flex items-center gap-2">
              {/* Show page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first, last, current, and adjacent pages
                const showPage = page === 1 || 
                                 page === totalPages || 
                                 Math.abs(page - currentPage) <= 1;
                
                // Show ellipsis for gaps
                const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;
                
                if (showEllipsisBefore || showEllipsisAfter) {
                  return <span key={page} className="text-gray-400 px-2">...</span>;
                }
                
                if (!showPage) return null;
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2"
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Page info */}
        {totalPages > 1 && (
          <div className="text-center mt-4 text-sm text-gray-500">
            Sayfa {currentPage} / {totalPages} ({filteredQuestions.length} soru)
          </div>
        )}
      </div>
    </section>
  );
};

export default AnsweredQuestionsSection;
