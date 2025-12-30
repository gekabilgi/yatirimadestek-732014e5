import React, { useState, useEffect } from 'react';
import MainNavbar from "@/components/MainNavbar";
import StandardHero from "@/components/StandardHero";
import AnsweredQuestionsSection from "@/components/AnsweredQuestionsSection";
import SoruSorModal from "@/components/SoruSorModal";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const QNA = () => {
  const [stats, setStats] = useState({
    totalQuestions: "0",
    activeExperts: "0",
    averageResponseTime: "Hesaplanıyor...",
    answeredRate: "%100"
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch average response time
        const { data: avgTimeData, error: avgTimeError } = await supabase.functions.invoke('calculate-avg-response-time');
        if (!avgTimeError && avgTimeData) {
          setStats(prev => ({ ...prev, averageResponseTime: avgTimeData.averageResponseTime || "24 saat" }));
        }

        // Fetch total public Q&A count via secure RPC
        const { data: totalCountData, error: totalError } = await supabase.rpc('get_public_qna_count');
        if (!totalError && totalCountData !== null) {
          setStats(prev => ({ ...prev, totalQuestions: totalCountData.toLocaleString() }));
        }

        // Fetch active experts (YDO users) via secure RPC
        const { data: expertsCountData, error: expertsError } = await supabase.rpc('get_ydo_user_count');
        if (!expertsError && expertsCountData !== null) {
          setStats(prev => ({ ...prev, activeExperts: expertsCountData.toString() }));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    { label: "Toplam Soru", value: stats.totalQuestions, icon: MessageSquare },
    { label: "Aktif Uzman", value: stats.activeExperts, icon: Users },
    { label: "Ort. Yanıt Süresi", value: stats.averageResponseTime, icon: Clock },
    { label: "Yanıt Oranı", value: stats.answeredRate, icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      <StandardHero
        title="Uzmanlarımıza Soru Sorun"
        description="Yatırım destekleri, teşvik sistemleri ve başvuru süreçleri hakkında merak ettiklerinizi alanında uzman ekibimize sorabilirsiniz."
        badge={{
          text: "Uzman Destek Sistemi",
          icon: Users
        }}
        compact
      >
        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4">
          {statsData.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.label} 
                className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/20"
              >
                <div className="flex items-center justify-center gap-2 sm:flex-col sm:gap-1">
                  <IconComponent className="h-4 w-4 text-white/80 shrink-0" />
                  <div className="text-lg sm:text-xl font-bold text-white">{stat.value}</div>
                </div>
                <div className="text-xs text-white/70 hidden sm:block">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </StandardHero>
      
      <div data-qna-section>
        <AnsweredQuestionsSection />
      </div>
      
      {/* Sabit Soru Sor Butonu - Yanıtlanmış Sorular ile hizalı */}
      <div className="fixed top-32 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
          <SoruSorModal 
            trigger={
              <Button 
                size="lg"
                className="pointer-events-auto px-6 py-4 text-lg font-semibold
                           shadow-xl hover:shadow-2xl 
                           transition-all duration-300 
                           bg-gradient-to-r from-primary to-blue-600 
                           hover:from-primary/90 hover:to-blue-500
                           animate-chatbot-pulse
                           flex items-center gap-3"
              >
                <MessageSquare className="h-6 w-6" />
                <span>Soru Sor</span>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default QNA;
