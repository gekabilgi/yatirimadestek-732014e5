import React from 'react';
import MainNavbar from '@/components/MainNavbar';
import Footer from '@/components/Footer';
import StandardHero from '@/components/StandardHero';
import type { FormTemplate } from '@/types/formBuilder';

interface IntegratedFormLayoutProps {
  form: FormTemplate;
  children: React.ReactNode;
}

const IntegratedFormLayout: React.FC<IntegratedFormLayoutProps> = ({ form, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNavbar />
      
      <StandardHero
        title={form.name}
        subtitle={form.description}
        compact
      />
      
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default IntegratedFormLayout;
