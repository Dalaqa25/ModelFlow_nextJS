'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Input from './Input';
import SpinningCube from './SpinningCube';
import LightBackground from '@/app/components/shared/LightBackground';

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
        <div className="max-w-6xl w-full mx-auto">
          <div className="flex flex-col-reverse gap-12 items-center lg:flex-row">
            <div className="w-full lg:w-1/2">
              <Input />
            </div>
            
            <SpinningCube
              rotateX={rotateX}
              rotateY={rotateY}
              className="w-full lg:w-1/2 lg:justify-end"
            />
          </div>
        </div>
      </div>
    </LightBackground>
  );
}