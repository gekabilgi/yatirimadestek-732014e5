
import React from 'react';
import MainNavbar from "@/components/MainNavbar";
import QnaSection from "@/components/QnaSection";
import AnsweredQuestionsSection from "@/components/AnsweredQuestionsSection";

const QNA = () => {
  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      <QnaSection />
      <AnsweredQuestionsSection />
    </div>
  );
};

export default QNA;
