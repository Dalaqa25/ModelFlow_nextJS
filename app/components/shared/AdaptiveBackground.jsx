'use client';

import { useEffect, useState } from 'react';
import UnifiedBackground from './UnifiedBackground';
import LightBackground from './LightBackground';
import { ThemeAdaptiveProvider } from '@/lib/theme-adaptive-context';

export default function AdaptiveBackground({ 
  variant = 'default', 
  children, 
  className = '',
  showParticles = false,
  showFloatingElements = true 
}) {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check system preference
    const checkSystemTheme = () => {
      if (typeof window !== 'undefined') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
      }
    };

    checkSystemTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Prevent flash of wrong theme on initial load
  if (!mounted) {
    return null;
  }

  // Switch between backgrounds based on system theme
  const BackgroundComponent = isDarkMode ? UnifiedBackground : LightBackground;

  return (
    <ThemeAdaptiveProvider>
      <BackgroundComponent
        variant={variant}
        className={className}
        showParticles={showParticles}
        showFloatingElements={showFloatingElements}
      >
        {children}
      </BackgroundComponent>
    </ThemeAdaptiveProvider>
  );
}

