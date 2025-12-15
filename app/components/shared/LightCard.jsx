'use client';

import { motion } from 'framer-motion';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function LightCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  padding = 'default'
}) {
  const { isDarkMode } = useThemeAdaptive();

  // Light mode optimized card variants
  const cardVariants = {
    default: isDarkMode 
      ? "bg-slate-800/20 backdrop-blur-[2px] border border-slate-700/20 shadow-sm"
      : "bg-white/80 backdrop-blur-[2px] border border-gray-200/60 shadow-sm",
    
    solid: isDarkMode
      ? "bg-slate-800/20 backdrop-blur-[4px] border border-slate-700/20 shadow-sm"
      : "bg-white/90 backdrop-blur-[4px] border border-gray-200/80 shadow-sm",
    
    glass: isDarkMode
      ? "bg-slate-800/20 backdrop-blur-[6px] border border-slate-600/20 shadow-sm"
      : "bg-white/70 backdrop-blur-[6px] border border-gray-200/50 shadow-sm",
    
    content: isDarkMode
      ? "bg-slate-800/20 backdrop-blur-[2px] border border-slate-600/20 shadow-sm"
      : "bg-white/85 backdrop-blur-[2px] border border-gray-200/70 shadow-sm",
    
    feature: isDarkMode
      ? "bg-gradient-to-br from-slate-800/20 to-purple-900/30 backdrop-blur-[4px] border border-purple-500/30 shadow-sm"
      : "bg-gradient-to-br from-white/90 to-purple-50/80 backdrop-blur-[4px] border border-purple-300/40 shadow-sm"
  };

  const paddingVariants = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const baseClasses = "rounded-2xl transition-all duration-300";
  
  const hoverClasses = hover 
    ? isDarkMode
      ? "hover:shadow-purple-500/10 hover:border-purple-500/30 hover:scale-[1.005] hover:bg-slate-800/60"
      : "hover:shadow-purple-500/20 hover:border-purple-400/50 hover:scale-[1.005] hover:bg-white/95"
    : "";

  const cardClass = cardVariants[variant] || cardVariants.default;
  const paddingClass = paddingVariants[padding] || paddingVariants.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${baseClasses} ${cardClass} ${paddingClass} ${hoverClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
}

