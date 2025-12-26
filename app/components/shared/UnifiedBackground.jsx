'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';

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
  const lastUpdateRef = useRef(0);

  // Throttled mouse move handler (~30fps)
  const handleMouseMove = useCallback((e) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 33) return; // ~30fps throttle
    lastUpdateRef.current = now;

    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (showFloatingElements) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [handleMouseMove, showFloatingElements]);

  // Different background variants
  const backgroundVariants = {
    // Landing page - lighter glassy look
    landing: "min-h-screen bg-gradient-to-br from-slate-700 via-purple-800 to-slate-800 overflow-hidden relative",
    
    // Default lighter theme for most pages
    default: "min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-purple-800 overflow-hidden relative",
    
    // Auth pages - lighter and more inviting
    auth: "min-h-screen bg-gradient-to-br from-slate-700 via-purple-700 to-slate-800 overflow-hidden relative",
    
    // Content pages - lighter for better visibility
    content: "min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-purple-800 overflow-hidden relative"
  };

  const backgroundClass = backgroundVariants[variant] || backgroundVariants.default;

  return (
    <div ref={containerRef} className={`${backgroundClass} ${className}`}>
      {/* Animated background elements - adjusted for each variant */}
      <div className="absolute inset-0">
        {variant === 'landing' ? (
          // Lighter landing page background elements
          <>
            <motion.div
              style={{
                x: useTransform(mouseX, [-0.5, 0.5], [-3, 3]),
                y: useTransform(mouseY, [-0.5, 0.5], [-2, 2]),
              }}
              className="absolute top-20 left-20 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl"
            />
            <motion.div
              style={{
                x: useTransform(mouseX, [-0.5, 0.5], [4, -4]),
                y: useTransform(mouseY, [-0.5, 0.5], [2, -2]),
              }}
              className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl"
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/15 to-transparent rounded-full" />
          </>
        ) : (
          // Subtle background elements for other pages
          <>
            <motion.div
              style={showFloatingElements ? {
                x: useTransform(mouseX, [-0.5, 0.5], [-2, 2]),
                y: useTransform(mouseY, [-0.5, 0.5], [-1, 1]),
              } : {}}
              className="absolute top-20 left-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl"
            />
            <motion.div
              style={showFloatingElements ? {
                x: useTransform(mouseX, [-0.5, 0.5], [2, -2]),
                y: useTransform(mouseY, [-0.5, 0.5], [1, -1]),
              } : {}}
              className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl"
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-500/8 to-transparent rounded-full" />
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