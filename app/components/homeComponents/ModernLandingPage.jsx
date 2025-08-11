'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative pt-16">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          style={{
            x: useTransform(mouseX, [-0.5, 0.5], [-3, 3]),
            y: useTransform(mouseY, [-0.5, 0.5], [-2, 2]),
          }}
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
        ></motion.div>
        <motion.div
          style={{
            x: useTransform(mouseX, [-0.5, 0.5], [4, -4]),
            y: useTransform(mouseY, [-0.5, 0.5], [2, -2]),
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"
        ></motion.div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/10 to-transparent rounded-full"></div>
      </div>

      {/* Floating particles */}
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

      <div
        ref={containerRef}
        className="relative z-10 min-h-screen flex items-center justify-center px-6"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8"
            >
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
              AI Model Marketplace
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
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
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-lg sm:text-xl text-gray-300 mb-8 max-w-lg mx-auto lg:mx-0"
            >
              The next-generation marketplace for pre-trained AI models.
              Upload, discover, and monetize cutting-edge machine learning models.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-sm sm:text-base"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/modelsList')}
                className="px-6 sm:px-8 py-3 sm:py-4 border border-purple-500/50 text-purple-300 font-semibold rounded-2xl hover:bg-purple-500/10 transition-all duration-300 text-sm sm:text-base"
              >
                Explore Models
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex justify-center lg:justify-start gap-6 sm:gap-8 mt-8 sm:mt-12"
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">1000+</div>
                <div className="text-xs sm:text-sm text-gray-400">AI Models</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">500+</div>
                <div className="text-xs sm:text-sm text-gray-400">Developers</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">50+</div>
                <div className="text-xs sm:text-sm text-gray-400">Categories</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right 3D Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative flex justify-center items-center mt-8 lg:mt-0"
          >
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96"
            >
              {/* Main 3D Cube */}
              <motion.div
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 transform-gpu preserve-3d"
              >
                {/* Cube faces */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50 rounded-2xl sm:rounded-3xl backdrop-blur-sm translateZ-48"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/50 rounded-2xl sm:rounded-3xl backdrop-blur-sm rotateY-90 translateZ-48"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-red-500/30 border border-pink-500/50 rounded-2xl sm:rounded-3xl backdrop-blur-sm rotateY-180 translateZ-48"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-blue-500/30 border border-green-500/50 rounded-2xl sm:rounded-3xl backdrop-blur-sm rotateY-270 translateZ-48"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/50 rounded-2xl sm:rounded-3xl backdrop-blur-sm rotateX-90 translateZ-48"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/50 rounded-2xl sm:rounded-3xl backdrop-blur-sm rotateX-270 translateZ-48"></div>
              </motion.div>

              {/* Floating elements around the cube */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                  animate={{
                    x: [0, Math.cos(i * Math.PI / 3) * 100, Math.cos(i * Math.PI / 3) * 120],
                    y: [0, Math.sin(i * Math.PI / 3) * 100, Math.sin(i * Math.PI / 3) * 120],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 6 + i,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </motion.div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent rounded-full blur-3xl scale-150"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}