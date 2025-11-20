import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes } from '@/config/themes';
import { adminSettingsService } from '@/services/adminSettingsService';
import { supabase } from '@/integrations/supabase/client';

interface ThemeContextType {
  currentTheme: string;
  setTheme: (themeId: string) => Promise<void>;
  availableThemes: typeof themes;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<string>('corporate-blue');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch theme from database on mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const themeId = await adminSettingsService.getActiveTheme();
        setCurrentTheme(themeId);
      } catch (error) {
        console.error('Error fetching theme:', error);
        setCurrentTheme('corporate-blue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTheme();
  }, []);

  // Subscribe to realtime theme changes
  useEffect(() => {
    const subscription = supabase
      .channel('theme-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_settings',
          filter: 'setting_key=eq.active_app_theme'
        },
        (payload: any) => {
          const newTheme = payload.new.setting_value_text;
          if (newTheme && themes[newTheme]) {
            setCurrentTheme(newTheme);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Apply theme to document root
  useEffect(() => {
    const applyTheme = (themeId: string) => {
      const root = document.documentElement;
      
      // Remove all existing theme classes
      Object.keys(themes).forEach((id) => {
        root.classList.remove(`theme-${id}`);
      });
      
      // Add new theme class
      root.classList.add(`theme-${themeId}`);
      
      // Apply CSS variables
      const theme = themes[themeId];
      if (theme) {
        Object.entries(theme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value);
        });
      }
    };

    applyTheme(currentTheme);
  }, [currentTheme]);

  const setTheme = async (themeId: string) => {
    if (themes[themeId]) {
      setCurrentTheme(themeId);
      try {
        await adminSettingsService.setActiveTheme(themeId);
      } catch (error) {
        console.error('Error saving theme:', error);
        throw error;
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: themes, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
