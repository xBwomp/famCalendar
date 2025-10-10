import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTheme, Theme } from '../themes/theme.config';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getTheme());

  useEffect(() => {
    const interval = setInterval(() => {
      setTheme(getTheme());
    }, 60 * 1000); // Check for theme changes every minute

    return () => clearInterval(interval);
  }, []);

  const value: ThemeContextType = {
    theme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
