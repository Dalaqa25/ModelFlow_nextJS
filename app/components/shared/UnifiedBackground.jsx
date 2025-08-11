'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function UnifiedBackground({ 
  variant = 'default', 
  children, 
  className = '',
  showParticles = false,
  showFloatingElements = true 
}) {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

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

  // Different background variants
  const backgroundVariants = {
    // Landing page - keep the original dark glassy look
    landing: "min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative",
    
    // Default dark theme for most pages - less glassy, more content-friendly
    default: "min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-purple-900 overflow-hidden relative",
    
    // Auth pages - slightly lighter but still dark
    auth: "min-h-screen bg-gradient-to-br from-slate-800 via-purple-800 to-slate-900 overflow-hidden relative",
    
    // Content pages - darkest for better readability
    content: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 overflow-hidden relative"
  };

  const backgroundClass = backgroundVariants[variant] || backgroundVariants.default;

  return (
    <div ref={containerRef} className={`${backgroundClass} ${className}`}>
      {/* Animated background elements - adjusted for each variant */}
      <div className="absolute inset-0">
        {variant === 'landing' ? (
          // Original landing page background elements
          <>
            <motion.div
              style={{
                x: useTransform(mouseX, [-0.5, 0.5], [-3, 3]),
                y: useTransform(mouseY, [-0.5, 0.5], [-2, 2]),
              }}
              className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            />
            <motion.div
              style={{
                x: useTransform(mouseX, [-0.5, 0.5], [4, -4]),
                y: useTransform(mouseY, [-0.5, 0.5], [2, -2]),
              }}
              className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/10 to-transparent rounded-full" />
          </>
        ) : (
          // Subtle background elements for other pages
          <>
            <motion.div
              style={showFloatingElements ? {
                x: useTransform(mouseX, [-0.5, 0.5], [-2, 2]),
                y: useTransform(mouseY, [-0.5, 0.5], [-1, 1]),
              } : {}}
              className="absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
            />
            <motion.div
              style={showFloatingElements ? {
                x: useTransform(mouseX, [-0.5, 0.5], [2, -2]),
                y: useTransform(mouseY, [-0.5, 0.5], [1, -1]),
              } : {}}
              className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-500/5 to-transparent rounded-full" />
          </>
        )}
      </div>

      {/* Floating particles - only for landing page */}
      {showParticles && variant === 'landing' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
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
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}