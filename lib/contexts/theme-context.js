'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [themeMode, setThemeMode] = useState('system');

  const applyTheme = (isDark) => {
    setIsDarkMode(isDark);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedMode = window.localStorage.getItem('themeMode') || 'system';
      const savedTheme = window.localStorage.getItem('theme');
      
      setThemeMode(savedMode);

      const getSystemPreference = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (savedMode === 'system') {
        applyTheme(getSystemPreference());
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
          if (localStorage.getItem('themeMode') === 'system') applyTheme(e.matches);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        applyTheme(savedTheme === 'dark');
      }
    }
  }, [themeMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    applyTheme(newTheme);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      window.localStorage.setItem('themeMode', newTheme ? 'dark' : 'light');
      setThemeMode(newTheme ? 'dark' : 'light');
    }
  };

  const setTheme = (mode) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('themeMode', mode);
      setThemeMode(mode);
      if (mode === 'system') {
        applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        applyTheme(mode === 'dark');
        window.localStorage.setItem('theme', mode);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, themeMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
