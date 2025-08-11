'use client';

import { motion } from 'framer-motion';

export default function UnifiedCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  padding = 'default'
}) {
  // Different card variants for different contexts
  const cardVariants = {
    // Default card - semi-transparent with backdrop blur
    default: "bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 shadow-xl",
    
    // Solid card - for content that needs better readability
    solid: "bg-slate-800/80 backdrop-blur-md border border-slate-700/60 shadow-2xl",
    
    // Glass card - more transparent, for overlays
    glass: "bg-slate-800/20 backdrop-blur-lg border border-slate-600/30 shadow-lg",
    
    // Content card - best for text-heavy content
    content: "bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 shadow-2xl",
    
    // Feature card - for highlighting important content
    feature: "bg-gradient-to-br from-slate-800/60 to-purple-900/40 backdrop-blur-md border border-purple-500/30 shadow-2xl"
  };

  const paddingVariants = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const baseClasses = "rounded-2xl transition-all duration-300";
  const hoverClasses = hover ? "hover:shadow-purple-500/20 hover:border-purple-500/40 hover:scale-[1.02]" : "";
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