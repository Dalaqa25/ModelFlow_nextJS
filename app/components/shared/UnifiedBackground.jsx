'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';
import CursorReactiveGrid from './CursorReactiveGrid';

export default function UnifiedBackground({
  variant = 'default',
  children,
  className = '',
  showParticles = false,
  showFloatingElements = true,
  showPattern = false,
  showReactiveGrid = false,
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

  const isLandingVariant = variant === 'landing';
  const shellClass = `${isLandingVariant ? 'landing-shell' : ''} relative min-h-screen overflow-hidden`;
  const shouldShowPattern = showPattern || variant === 'content';
  const leftBlobOpacity = isLandingVariant ? '0.24' : '0.14';
  const rightBlobOpacity = isLandingVariant ? '0.30' : '0.20';

  return (
    <div ref={containerRef} className={`${shellClass} ${className}`}>
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          style={showFloatingElements ? {
            x: useTransform(mouseX, [-0.5, 0.5], [-6, 6]),
            y: useTransform(mouseY, [-0.5, 0.5], [-4, 4]),
          } : {}}
          className="decorative-blob"
          aria-hidden="true"
        >
          <div
            className="h-[520px] w-[520px] rounded-full"
            style={{
              opacity: leftBlobOpacity,
              background: 'radial-gradient(circle, rgba(199,125,255,0.24) 0%, transparent 70%)',
              transform: 'translate(-28%, -28%)',
            }}
          />
        </motion.div>
        <motion.div
          style={showFloatingElements ? {
            x: useTransform(mouseX, [-0.5, 0.5], [8, -8]),
            y: useTransform(mouseY, [-0.5, 0.5], [5, -5]),
          } : {}}
          className="decorative-blob absolute right-0 top-0"
          aria-hidden="true"
        >
          <div
            className="h-[560px] w-[560px] rounded-full"
            style={{
              opacity: rightBlobOpacity,
              background: 'radial-gradient(circle, rgba(93,88,255,0.24) 0%, transparent 70%)',
              transform: 'translate(24%, -16%)',
            }}
          />
        </motion.div>
        <div
          className="decorative-blob absolute left-1/2 top-[44%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
          style={{
            opacity: isLandingVariant ? 0.18 : 0.12,
            background: 'radial-gradient(circle, rgba(244,243,255,0.14) 0%, transparent 72%)',
          }}
        />
      </div>

      {shouldShowPattern && (
        <div className="landing-pattern absolute inset-0" aria-hidden="true" />
      )}

      <CursorReactiveGrid enabled={showReactiveGrid && variant === 'content'} theme="dark" />

      {showParticles && isLandingVariant && (
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
