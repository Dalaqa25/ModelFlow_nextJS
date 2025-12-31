'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';

export default function SpinningCube({ className = '' }) {
  const containerRef = useRef(null);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.4 }}
      className={`relative flex justify-center items-center ${className}`}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="absolute w-full h-full"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-20deg) rotateY(-30deg)' }}
        >
          <div className="absolute w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50 rounded-3xl [transform:rotateY(0deg)_translateZ(6rem)] sm:[transform:rotateY(0deg)_translateZ(8rem)] lg:[transform:rotateY(0deg)_translateZ(9rem)] xl:[transform:rotateY(0deg)_translateZ(10rem)] 2xl:[transform:rotateY(0deg)_translateZ(12rem)]"></div>
          <div className="absolute w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/50 rounded-3xl [transform:rotateY(90deg)_translateZ(6rem)] sm:[transform:rotateY(90deg)_translateZ(8rem)] lg:[transform:rotateY(90deg)_translateZ(9rem)] xl:[transform:rotateY(90deg)_translateZ(10rem)] 2xl:[transform:rotateY(90deg)_translateZ(12rem)]"></div>
          <div className="absolute w-full h-full bg-gradient-to-br from-pink-500/30 to-red-500/30 border border-pink-500/50 rounded-3xl [transform:rotateY(180deg)_translateZ(6rem)] sm:[transform:rotateY(180deg)_translateZ(8rem)] lg:[transform:rotateY(180deg)_translateZ(9rem)] xl:[transform:rotateY(180deg)_translateZ(10rem)] 2xl:[transform:rotateY(180deg)_translateZ(12rem)]"></div>
          <div className="absolute w-full h-full bg-gradient-to-br from-green-500/30 to-blue-500/30 border border-green-500/50 rounded-3xl [transform:rotateY(-90deg)_translateZ(6rem)] sm:[transform:rotateY(-90deg)_translateZ(8rem)] lg:[transform:rotateY(-90deg)_translateZ(9rem)] xl:[transform:rotateY(-90deg)_translateZ(10rem)] 2xl:[transform:rotateY(-90deg)_translateZ(12rem)]"></div>
          <div className="absolute w-full h-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/50 rounded-3xl [transform:rotateX(90deg)_translateZ(6rem)] sm:[transform:rotateX(90deg)_translateZ(8rem)] lg:[transform:rotateX(90deg)_translateZ(9rem)] xl:[transform:rotateX(90deg)_translateZ(10rem)] 2xl:[transform:rotateX(90deg)_translateZ(12rem)]"></div>
          <div className="absolute w-full h-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/50 rounded-3xl [transform:rotateX(-90deg)_translateZ(6rem)] sm:[transform:rotateX(-90deg)_translateZ(8rem)] lg:[transform:rotateX(-90deg)_translateZ(9rem)] xl:[transform:rotateX(-90deg)_translateZ(10rem)] 2xl:[transform:rotateX(-90deg)_translateZ(12rem)]"></div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent rounded-full scale-150"></div>
    </motion.div>
  );
}
