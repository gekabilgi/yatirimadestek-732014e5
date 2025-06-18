
import React from 'react';
import MainNavbar from '@/components/MainNavbar';
import EnhancedHero from '@/components/EnhancedHero';
import AnnouncementStream from '@/components/AnnouncementStream';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      <EnhancedHero />
      <AnnouncementStream />
    </div>
  );
};

export default Index;
