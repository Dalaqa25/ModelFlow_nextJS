'use client';

import UnifiedBackground from './UnifiedBackground';
import LightBackground from './LightBackground';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function AdaptiveBackground({ 
  variant = 'default', 
  children, 
  className = '',
  showParticles = false,
  showFloatingElements = true 
}) {
  const { isDarkMode, mounted } = useThemeAdaptive();

  // Prevent flash of wrong theme on initial load
  // Show dark mode by default while checking
  if (!mounted) {
    return (
      <UnifiedBackground
        variant={variant}
        className={className}
        showParticles={showParticles}
        showFloatingElements={showFloatingElements}
      >
        {children}
      </UnifiedBackground>
    );
  }

  // Switch between backgrounds based on system theme
  const BackgroundComponent = isDarkMode ? UnifiedBackground : LightBackground;

  return (
    <BackgroundComponent
      variant={variant}
      className={className}
      showParticles={showParticles}
      showFloatingElements={showFloatingElements}
    >
      {children}
    </BackgroundComponent>
  );
}

