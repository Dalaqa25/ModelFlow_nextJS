'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from './theme-context';

const ThemeAdaptiveContext = createContext({
  isDarkMode: true,
  textColors: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    gradient: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
  }
});

export function ThemeAdaptiveProvider({ children }) {
  const { isDarkMode: themeIsDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-aware text colors
  const textColors = themeIsDarkMode ? {
    primary: 'text-white',
    secondary: 'text-gray-300',
    tertiary: 'text-gray-400',
    muted: 'text-gray-500',
    gradient: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
  } : {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    tertiary: 'text-gray-600',
    muted: 'text-gray-500',
    gradient: 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent',
  };

  const value = {
    isDarkMode: themeIsDarkMode,
    mounted,
    textColors,
  };

  return (
    <ThemeAdaptiveContext.Provider value={value}>
      {children}
    </ThemeAdaptiveContext.Provider>
  );
}

export function useThemeAdaptive() {
  const context = useContext(ThemeAdaptiveContext);
  if (!context) {
    throw new Error('useThemeAdaptive must be used within ThemeAdaptiveProvider');
  }
  return context;
}

