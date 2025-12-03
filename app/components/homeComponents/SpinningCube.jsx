'use client';

import { motion } from 'framer-motion';

export default function SpinningCube({
  rotateX,
  rotateY,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.4 }}
      className={`relative flex justify-center items-center ${className}`}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
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
  );
}

