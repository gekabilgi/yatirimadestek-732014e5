import React, { useState, useEffect } from 'react';
import MainNavbar from "@/components/MainNavbar";
import StandardHero from "@/components/StandardHero";
import QnaSection from "@/components/QnaSection";
import AnsweredQuestionsSection from "@/components/AnsweredQuestionsSection";
import SoruSorModal from "@/components/SoruSorModal";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users } from 'lucide-react';

const QNA = () => {
  const [showStickyButton, setShowStickyButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Get the QnaSection height to determine when to show sticky button
      const qnaSection = document.querySelector('[data-qna-section]');
      if (qnaSection) {
        const qnaSectionBottom = qnaSection.getBoundingClientRect().bottom;
        // Show sticky button when QnaSection is scrolled past (out of view)
        setShowStickyButton(qnaSectionBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      />
      
      <div data-qna-section>
        <QnaSection />
      </div>
      <AnsweredQuestionsSection />
      
      {/* Sticky Soru Sor Button */}
      {showStickyButton && (
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50">
          {/* Outer ping ring */}
          <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping" />
          
          <SoruSorModal 
            trigger={
              <Button 
                size="lg"
                className="relative rounded-full p-4 shadow-lg hover:shadow-2xl 
                           transition-all duration-300 
                           bg-gradient-to-r from-primary to-blue-600 
                           hover:from-primary/90 hover:to-blue-500
                           animate-glow
                           group"
              >
                <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[10px] items-center justify-center font-bold">
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
