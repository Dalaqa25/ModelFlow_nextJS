'use client';

import { useRef } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

export default function LightBackground({
  variant = 'default',
  children,
  className = '',
  showParticles = false,
}) {
  const containerRef = useRef(null);
  const { isDarkMode } = useThemeAdaptive();

  // Light mode optimized background variants
  const backgroundVariants = {
    landing: isDarkMode
      ? "min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative"
      : "min-h-screen bg-gradient-to-br from-purple-50/40 via-purple-100/30 to-purple-50/40 overflow-hidden relative",

    default: isDarkMode
      ? "min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-purple-900 overflow-hidden relative"
      : "min-h-screen bg-gradient-to-br from-white via-slate-50 to-purple-50/20 overflow-hidden relative",

    auth: isDarkMode
      ? "min-h-screen bg-gradient-to-br from-slate-800 via-purple-800 to-slate-900 overflow-hidden relative"
      : "min-h-screen bg-gradient-to-br from-slate-100 via-purple-50/40 to-slate-50 overflow-hidden relative",

    content: isDarkMode
      ? "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 overflow-hidden relative"
      : "min-h-screen bg-gradient-to-br from-white via-slate-50 to-purple-50/30 overflow-hidden relative"
  };

  const backgroundClass = backgroundVariants[variant] || backgroundVariants.default;

  // Light mode optimized decorative elements
  const blobColor = isDarkMode ? 'bg-purple-500/20' : 'bg-purple-400/15';
  const blobColor2 = isDarkMode ? 'bg-purple-600/20' : 'bg-purple-500/15';
  const gradientColor = isDarkMode ? 'from-purple-500/10' : 'from-purple-400/8';

  return (
    <div ref={containerRef} className={`${backgroundClass} ${className}`}>
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

