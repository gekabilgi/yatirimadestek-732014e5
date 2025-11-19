import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes } from '@/config/themes';

interface ThemeContextType {
  currentTheme: string;
  setTheme: (themeId: string) => void;
  availableThemes: typeof themes;
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
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    // Load theme from localStorage or default to corporate-blue
    return localStorage.getItem('app-theme') || 'corporate-blue';
  });

  useEffect(() => {
    // Apply theme class to document root
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

  const setTheme = (themeId: string) => {
    if (themes[themeId]) {
      setCurrentTheme(themeId);
      localStorage.setItem('app-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
