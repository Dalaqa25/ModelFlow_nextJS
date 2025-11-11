'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';

export default function ModernLandingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const containerRef = useRef(null);
  
  // Mouse tracking for gyroscope effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 40, stiffness: 300 };
  const lightSpringConfig = { damping: 50, stiffness: 200 };
  
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

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <UnifiedBackground variant="landing" showParticles={true} className="pt-16 md:pt-24">
      <div
        ref={containerRef}
        className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 sm:px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-40 xl:gap-48 2xl:gap-56 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight"
            >
              Upload & Sell
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Models
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0"
            >
              The next-generation marketplace for pre-trained AI models.
              Upload, discover, and monetize cutting-edge machine learning models.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-12"
            >
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-base"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/modelsList')}
                className="px-8 py-4 border border-purple-500/50 text-purple-300 font-semibold rounded-2xl hover:bg-purple-500/10 transition-all duration-300 text-base"
              >
                Explore Models
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex justify-center lg:justify-start gap-6 sm:gap-8 mt-8 sm:mt-12"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1000+</div>
                <div className="text-sm text-gray-400">AI Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm text-gray-400">Developers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm text-gray-400">Categories</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right 3D Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative flex justify-center items-center mt-8 lg:mt-0 order-1 lg:order-2"
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
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/25 via-transparent to-transparent rounded-full blur-3xl scale-150"></div>
          </motion.div>
        </div>
      </div>
    </UnifiedBackground>
  );
}