import React, { useState, useEffect } from 'react';
import MainNavbar from "@/components/MainNavbar";
import StandardHero from "@/components/StandardHero";
import QnaSection from "@/components/QnaSection";
import AnsweredQuestionsSection from "@/components/AnsweredQuestionsSection";
import SoruSorModal from "@/components/SoruSorModal";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const QNA = () => {
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [stats, setStats] = useState({
    totalQuestions: "0",
    activeExperts: "0",
    averageResponseTime: "Hesaplanıyor...",
    answeredRate: "%100"
  });

  useEffect(() => {
    const handleScroll = () => {
      const qnaSection = document.querySelector('[data-qna-section]');
      if (qnaSection) {
        const qnaSectionBottom = qnaSection.getBoundingClientRect().bottom;
        setShowStickyButton(qnaSectionBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        {/* Stats Grid inside Hero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {statsData.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.label} 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/20"
              >
                <div className="flex justify-center mb-2">
                  <div className="rounded-lg bg-white/10 p-2">
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-white/70">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </StandardHero>
      
      <div data-qna-section>
        <QnaSection />
      </div>
      <AnsweredQuestionsSection />
      
      {/* Sticky Soru Sor Button */}
      {showStickyButton && (
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50">
          <SoruSorModal 
            trigger={
              <Button 
                size="lg"
                className="relative rounded-full p-6 shadow-xl hover:shadow-2xl 
                           transition-all duration-300 
                           bg-gradient-to-r from-primary to-blue-600 
                           hover:from-primary/90 hover:to-blue-500
                           animate-chatbot-pulse
                           group"
              >
                <MessageSquare className="h-10 w-10 group-hover:scale-110 transition-transform" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 flex h-7 w-7">
                  <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-7 w-7 bg-red-500 text-white text-sm items-center justify-center font-bold">
                    ?
                  </span>
                </span>
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
};

export default QNA;
