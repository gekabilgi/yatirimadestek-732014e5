import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminSettingsService } from '@/services/adminSettingsService';

export type LogoColorMode = 'all_themed' | 'graphic_themed' | 'text_themed' | 'original' | 'all_white';

interface LogoSettingsContextType {
  logoColorMode: LogoColorMode;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const LogoSettingsContext = createContext<LogoSettingsContextType | undefined>(undefined);

export const LogoSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logoColorMode, setLogoColorMode] = useState<LogoColorMode>('all_themed');
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const mode = await adminSettingsService.getLogoColorMode();
      setLogoColorMode(mode);
    } catch (error) {
      console.error('Error loading logo settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <LogoSettingsContext.Provider value={{ logoColorMode, isLoading, refreshSettings }}>
      {children}
    </LogoSettingsContext.Provider>
  );
};

export const useLogoSettings = (): LogoSettingsContextType => {
  const context = useContext(LogoSettingsContext);
  if (context === undefined) {
    throw new Error('useLogoSettings must be used within a LogoSettingsProvider');
  }
  return context;
};
