
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageSquare, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import SoruSorModal from './SoruSorModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const QnaSection = () => {
  const [averageResponseTime, setAverageResponseTime] = useState("Hesaplanıyor...");
  const [totalQuestions, setTotalQuestions] = useState("0");
  const [activeExperts, setActiveExperts] = useState("0");
  const [answeredRate, setAnsweredRate] = useState("0%");
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch average response time
        const { data: avgTimeData, error: avgTimeError } = await supabase.functions.invoke('calculate-avg-response-time');
        if (!avgTimeError && avgTimeData) {
          setAverageResponseTime(avgTimeData.averageResponseTime || "24 saat");
        }

        // Fetch total public Q&A count via secure RPC
        const { data: totalCountData, error: totalError } = await supabase.rpc('get_public_qna_count');
        if (!totalError && totalCountData !== null) {
          setTotalQuestions(totalCountData.toLocaleString());
        }

        // Fetch active experts (YDO users) via secure RPC
        const { data: expertsCountData, error: expertsError } = await supabase.rpc('get_ydo_user_count');
        if (!expertsError && expertsCountData !== null) {
          setActiveExperts(expertsCountData.toString());
        }

        // Fetch answered questions rate
        if (totalCountData && totalCountData > 0) {
          const rate = Math.round(100); // All returned are answered by definition
          setAnsweredRate(`%${rate}`);
        }

      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    { label: "Toplam Soru", value: totalQuestions, icon: MessageSquare },
    { label: "Aktif Uzman", value: activeExperts, icon: Users },
    { label: "Ortalama Yanıt Süresi", value: averageResponseTime, icon: Clock },
    { label: "Yanıtlanan Sorular", value: answeredRate, icon: CheckCircle },
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <SoruSorModal />
        </div>

        {/* Stats Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="border-0 shadow-md bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      {stat.label}
                      {stat.label === "Yanıtlanan Sorular" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Yanıtlanmasına gerek duyulmayan cevaplar yayımlanmamıştır</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Nasıl Çalışır?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                  Yukarıdaki "Soru Sor\" butonuna tıklayarak form ile sorunuzu gönderin
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                  Sorunuz ilgili uzman ekibe yönlendirilir
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                  24-48 saat içinde e-posta ile yanıt alırsınız
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Sık Sorulan Konular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Yatırım teşvik başvuru süreçleri</li>
                <li>• Sektörel destek programları</li>
                <li>• Bölgesel teşvik imkanları</li>
                <li>• Gerekli belgeler ve şartlar</li>
                <li>• Başvuru sonrası süreçler</li>
                <li>• Vergi indirimleri ve muafiyetler</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default QnaSection;
