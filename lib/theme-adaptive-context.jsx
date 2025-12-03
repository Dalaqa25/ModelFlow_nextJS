'use client';

import { createContext, useContext, useEffect, useState } from 'react';

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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkSystemTheme = () => {
      if (typeof window !== 'undefined') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
      }
    };

    checkSystemTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Theme-aware text colors
  const textColors = isDarkMode ? {
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
    isDarkMode,
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

