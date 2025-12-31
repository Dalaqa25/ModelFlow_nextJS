'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Input from './Input';
import SpinningCube from './SpinningCube';
import LightBackground from '@/app/components/shared/LightBackground';
import DevelopersSection from './DevelopersSection';
import HowItWorksSection from './HowItWorksSection';
import ForDevelopersSection from './ForDevelopersSection';
import SocialProofSection from './SocialProofSection';
import CTASection from './CTASection';
import Footer from './Footer';

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
      {/* Hero Section */}
      <div
        ref={containerRef}
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        <div className="max-w-7xl 2xl:max-w-[1600px] w-full mx-auto">
          <div className="flex flex-col-reverse gap-12 items-center lg:flex-row lg:gap-8 xl:gap-12 2xl:gap-16">
            <div className="w-full lg:w-1/2">
              <Input />
            </div>
            
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end lg:pr-8 xl:pr-12">
              <SpinningCube />
            </div>
          </div>
        </div>
      </div>

      {/* Developers Got Your Back */}
      <DevelopersSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* For Developers */}
      <ForDevelopersSection />

      {/* Social Proof */}
      <SocialProofSection />

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </LightBackground>
  );
}
