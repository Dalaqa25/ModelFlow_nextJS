'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import LightBackground from '@/app/components/shared/LightBackground';
import Input from './Input';

export default function ModernLandingPage() {
  const containerRef = useRef(null);
  
  // Mouse tracking for gyroscope effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 40, stiffness: 300 };
  
  // Much more subtle 3D cube rotations
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);


  return (
    <LightBackground variant="landing" showParticles={true} className="pt-0">
      <div
        ref={containerRef}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6"
      >
        <div className="max-w-3xl w-full mx-auto">
          <Input />
          
          {/* 3D Cube Element - Commented out for now, can be restored later */}
          {/* 
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative flex justify-center items-center"
            style={{ perspective: '1000px' }}
          >
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              className="relative w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72"
            >
              <motion.div
                className="absolute w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: 360, rotateX: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              >
                <div className="absolute w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50 rounded-3xl backdrop-blur-sm [transform:rotateY(0deg)_translateZ(5rem)] sm:[transform:rotateY(0deg)_translateZ(7rem)] lg:[transform:rotateY(0deg)_translateZ(9rem)]"></div>
                <div className="absolute w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/50 rounded-3xl backdrop-blur-sm [transform:rotateY(90deg)_translateZ(5rem)] sm:[transform:rotateY(90deg)_translateZ(7rem)] lg:[transform:rotateY(90deg)_translateZ(9rem)]"></div>
                <div className="absolute w-full h-full bg-gradient-to-br from-pink-500/30 to-red-500/30 border border-pink-500/50 rounded-3xl backdrop-blur-sm [transform:rotateY(180deg)_translateZ(5rem)] sm:[transform:rotateY(180deg)_translateZ(7rem)] lg:[transform:rotateY(180deg)_translateZ(9rem)]"></div>
                <div className="absolute w-full h-full bg-gradient-to-br from-green-500/30 to-blue-500/30 border border-green-500/50 rounded-3xl backdrop-blur-sm [transform:rotateY(-90deg)_translateZ(5rem)] sm:[transform:rotateY(-90deg)_translateZ(7rem)] lg:[transform:rotateY(-90deg)_translateZ(9rem)]"></div>
                <div className="absolute w-full h-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/50 rounded-3xl backdrop-blur-sm [transform:rotateX(90deg)_translateZ(5rem)] sm:[transform:rotateX(90deg)_translateZ(7rem)] lg:[transform:rotateX(90deg)_translateZ(9rem)]"></div>
                <div className="absolute w-full h-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/50 rounded-3xl backdrop-blur-sm [transform:rotateX(-90deg)_translateZ(5rem)] sm:[transform:rotateX(-90deg)_translateZ(7rem)] lg:[transform:rotateX(-90deg)_translateZ(9rem)]"></div>
              </motion.div>
            </motion.div>
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/25 via-transparent to-transparent rounded-full blur-3xl scale-150"></div>
          </motion.div>
          */}
        </div>
      </div>
    </LightBackground>
  );
}