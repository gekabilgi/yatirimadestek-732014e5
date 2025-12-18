import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminSettingsService, LogoColorMode } from '@/services/adminSettingsService';

interface LogoSettingsContextType {
  logoColorMode: LogoColorMode;
  isLoading: boolean;
}

const LogoSettingsContext = createContext<LogoSettingsContextType>({
  logoColorMode: 'all_themed',
  isLoading: true
});

export const useLogoSettings = () => {
  const context = useContext(LogoSettingsContext);
  if (!context) {
    throw new Error('useLogoSettings must be used within a LogoSettingsProvider');
  }
  return context;
};

interface LogoSettingsProviderProps {
  children: ReactNode;
}

export const LogoSettingsProvider: React.FC<LogoSettingsProviderProps> = ({ children }) => {
  const [logoColorMode, setLogoColorMode] = useState<LogoColorMode>('all_themed');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogoMode = async () => {
      try {
        const mode = await adminSettingsService.getLogoColorMode();
        setLogoColorMode(mode);
      } catch (error) {
        console.error('Error fetching logo color mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogoMode();
  }, []);

  return (
    <LogoSettingsContext.Provider value={{ logoColorMode, isLoading }}>
      {children}
    </LogoSettingsContext.Provider>
  );
};
