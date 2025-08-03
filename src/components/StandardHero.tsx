import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StandardHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: {
    text: string;
    icon?: LucideIcon;
  };
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'teal';
  children?: React.ReactNode;
  compact?: boolean;
}

const StandardHero: React.FC<StandardHeroProps> = ({
  title,
  subtitle,
  description,
  badge,
  gradient = 'blue',
  children,
  compact = false
}) => {
  const gradientClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    purple: 'from-purple-600 to-purple-700',
    orange: 'from-orange-600 to-orange-700',
    teal: 'from-teal-600 to-teal-700'
  };

  const paddingClass = compact ? 'py-12 sm:py-16' : 'py-16 sm:py-20';

  return (
    <section className={`relative overflow-hidden bg-gradient-to-r ${gradientClasses[gradient]} text-white ${paddingClass}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-white/10 opacity-20 blur-[100px]"></div>
      </div>
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          {badge && (
            <div className="mb-6 animate-fade-in">
              <span className="inline-flex items-center rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white border border-white/20 shadow-sm backdrop-blur-sm">
                {badge.icon && (
                  <badge.icon className="mr-3 h-4 w-4" />
                )}
                <span className="mr-3 h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                {badge.text}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className={`font-bold tracking-tight text-white mb-6 animate-fade-in ${
            compact ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-4xl sm:text-5xl lg:text-6xl'
          }`}>
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <h2 className="text-xl sm:text-2xl font-medium text-white/90 mb-6 animate-fade-in">
              {subtitle}
            </h2>
          )}

          {/* Description */}
          {description && (
            <p className="text-lg sm:text-xl leading-8 text-white/80 max-w-3xl mx-auto mb-8 animate-fade-in font-medium">
              {description}
            </p>
          )}

          {/* Children (CTAs, buttons, etc.) */}
          {children && (
            <div className="animate-fade-in">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StandardHero;