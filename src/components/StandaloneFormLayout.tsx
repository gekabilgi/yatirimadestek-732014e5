import React from 'react';
import type { FormBranding } from '@/types/formBuilder';

interface StandaloneFormLayoutProps {
  branding: FormBranding;
  formName: string;
  children: React.ReactNode;
}

const StandaloneFormLayout: React.FC<StandaloneFormLayoutProps> = ({
  branding,
  formName,
  children,
}) => {
  const accentColor = branding.accent_color || 'hsl(var(--primary))';
  const bgColor = branding.background_color || 'hsl(var(--background))';
  const title = branding.header_title || formName;
  const layout = branding.header_layout || 'centered';

  const renderCenteredLayout = () => (
    <div className="relative w-full overflow-hidden" style={{ background: accentColor }}>
      {/* Logo */}
      {branding.logo_url && (
        <div className="absolute top-4 right-4 z-10">
          <img 
            src={branding.logo_url} 
            alt="Logo" 
            className="h-12 w-auto object-contain bg-white/90 rounded-lg p-2"
          />
        </div>
      )}
      
      {/* Header Content */}
      <div className="relative z-10 px-4 py-12 sm:py-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white uppercase tracking-wider mb-2">
          {title}
        </h1>
        {branding.header_subtitle && (
          <p className="text-lg sm:text-xl text-white/90 mt-2">
            {branding.header_subtitle}
          </p>
        )}
      </div>

      {/* Header Image */}
      {branding.header_image_url && (
        <div className="flex justify-center pb-8">
          <img 
            src={branding.header_image_url} 
            alt="Header" 
            className="max-w-xs sm:max-w-md rounded-lg shadow-lg"
          />
        </div>
      )}
      
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 20px
          )`
        }} />
      </div>
    </div>
  );

  const renderSideImageLayout = (imagePosition: 'left' | 'right') => (
    <div className="relative w-full overflow-hidden" style={{ background: accentColor }}>
      {/* Logo */}
      {branding.logo_url && (
        <div className="absolute top-4 right-4 z-10">
          <img 
            src={branding.logo_url} 
            alt="Logo" 
            className="h-12 w-auto object-contain bg-white/90 rounded-lg p-2"
          />
        </div>
      )}
      
      <div className={`flex flex-col md:flex-row ${imagePosition === 'right' ? 'md:flex-row-reverse' : ''} items-center`}>
        {/* Image Side */}
        {branding.header_image_url && (
          <div className="w-full md:w-1/2 p-4 sm:p-8">
            <img 
              src={branding.header_image_url} 
              alt="Header" 
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}
        
        {/* Text Side */}
        <div className={`w-full ${branding.header_image_url ? 'md:w-1/2' : ''} px-4 py-8 sm:py-12 ${imagePosition === 'left' ? 'text-left md:pl-8' : 'text-right md:pr-8'}`}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white uppercase tracking-wider mb-2">
            {title}
          </h1>
          {branding.header_subtitle && (
            <p className="text-lg sm:text-xl text-white/90 mt-2">
              {branding.header_subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 20px
          )`
        }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Header Section */}
      {branding.show_header && (
        <>
          {layout === 'centered' && renderCenteredLayout()}
          {layout === 'left-image' && renderSideImageLayout('left')}
          {layout === 'right-image' && renderSideImageLayout('right')}
        </>
      )}
      
      {/* Form Content */}
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <style dangerouslySetInnerHTML={{
            __html: `
              .branded-form button[type="submit"] {
                background-color: ${accentColor} !important;
              }
              .branded-form button[type="submit"]:hover {
                opacity: 0.9;
              }
              .branded-form input:focus,
              .branded-form textarea:focus,
              .branded-form select:focus {
                border-color: ${accentColor} !important;
                box-shadow: 0 0 0 2px ${accentColor}20 !important;
              }
            `
          }} />
          <div className="branded-form">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneFormLayout;
