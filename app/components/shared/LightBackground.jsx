'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function LightBackground({ 
  variant = 'default', 
  children, 
  className = '',
  showParticles = false,
  showFloatingElements = true 
}) {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      
      mouseX.set(x);
      mouseY.set(y);
    };

    if (showFloatingElements) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [mouseX, mouseY, showFloatingElements]);

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

  // Light mode optimized decorative elements - purple/deep purple theme
  const blobColor = isDarkMode ? 'bg-purple-500/20' : 'bg-purple-400/15';
  const blobColor2 = isDarkMode ? 'bg-purple-600/20' : 'bg-purple-500/15';
  const gradientColor = isDarkMode ? 'from-purple-500/10' : 'from-purple-400/8';
  const particleColor = isDarkMode ? 'bg-white/30' : 'bg-purple-400/40';

  return (
    <div ref={containerRef} className={`${backgroundClass} ${className}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {variant === 'landing' ? (
          <>
            <motion.div
              style={{
                x: useTransform(mouseX, [-0.5, 0.5], [-3, 3]),
                y: useTransform(mouseY, [-0.5, 0.5], [-2, 2]),
              }}
              className={`absolute top-20 left-20 w-72 h-72 ${blobColor} rounded-full blur-3xl animate-pulse`}
            />
            <motion.div
              style={{
                x: useTransform(mouseX, [-0.5, 0.5], [4, -4]),
                y: useTransform(mouseY, [-0.5, 0.5], [2, -2]),
              }}
              className={`absolute bottom-20 right-20 w-96 h-96 ${blobColor2} rounded-full blur-3xl animate-pulse delay-1000`}
            />
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial ${gradientColor} to-transparent rounded-full`} />
          </>
        ) : (
          <>
            <motion.div
              style={showFloatingElements ? {
                x: useTransform(mouseX, [-0.5, 0.5], [-2, 2]),
                y: useTransform(mouseY, [-0.5, 0.5], [-1, 1]),
              } : {}}
              className={`absolute top-20 left-20 w-64 h-64 ${blobColor} rounded-full blur-3xl animate-pulse`}
            />
            <motion.div
              style={showFloatingElements ? {
                x: useTransform(mouseX, [-0.5, 0.5], [2, -2]),
                y: useTransform(mouseY, [-0.5, 0.5], [1, -1]),
              } : {}}
              className={`absolute bottom-20 right-20 w-80 h-80 ${blobColor2} rounded-full blur-3xl animate-pulse delay-1000`}
            />
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial ${gradientColor} to-transparent rounded-full`} />
          </>
        )}
      </div>

      {/* Floating particles - purple/deep purple theme */}
      {showParticles && variant === 'landing' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(40)].map((_, i) => {
            // Mix of purple and deep purple particles
            const isDeepPurple = i % 3 === 0;
            const particleColorClass = isDarkMode 
              ? (isDeepPurple ? 'bg-purple-600/30' : 'bg-purple-400/30')
              : (isDeepPurple ? 'bg-purple-600/50' : 'bg-purple-400/50');
            return (
              <motion.div
                key={i}
                className={`absolute w-1.5 h-1.5 ${particleColorClass} rounded-full`}
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                }}
                animate={{
                  y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
                  x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)],
                }}
                transition={{
                  duration: Math.random() * 20 + 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

