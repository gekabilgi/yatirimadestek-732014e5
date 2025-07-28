
import React, { useState, useEffect } from 'react';
import MainNavbar from "@/components/MainNavbar";
import StandardHero from "@/components/StandardHero";
import QnaSection from "@/components/QnaSection";
import AnsweredQuestionsSection from "@/components/AnsweredQuestionsSection";
import SoruSorModal from "@/components/SoruSorModal";
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
        gradient="green"
        compact
      />
      
      <div data-qna-section>
        <QnaSection />
      </div>
      <AnsweredQuestionsSection />
      
      {/* Sticky Soru Sor Button */}
      {showStickyButton && (
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50">
          <div className="bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <SoruSorModal 
              trigger={
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <span className="hidden group-hover:block whitespace-nowrap text-sm font-medium">
                    Soru Sor
                  </span>
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QNA;
