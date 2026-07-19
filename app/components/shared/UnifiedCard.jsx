'use client';

import { motion } from 'framer-motion';

export default function UnifiedCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  padding = 'default'
}) {
  const cardVariants = {
    default: "landing-card-soft border border-[var(--landing-border)]",
    solid: "community-surface border border-[var(--landing-border)]",
    glass: "bg-white/30 dark:bg-white/[0.05] backdrop-blur-xl border border-[var(--landing-border)] shadow-[0_10px_28px_rgba(38,51,79,0.08)]",
    content: "community-surface border border-[var(--landing-border)]",
    feature: "border border-[var(--landing-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(127,140,255,0.18))] dark:bg-[linear-gradient(135deg,rgba(31,36,74,0.9),rgba(123,114,255,0.18))] backdrop-blur-xl shadow-[0_18px_50px_rgba(38,51,79,0.12)]"
  };

  const paddingVariants = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const baseClasses = "rounded-2xl transition-all duration-300";
  const hoverClasses = hover ? "hover:-translate-y-0.5 hover:border-[var(--landing-accent-2)]/35 hover:shadow-[0_20px_56px_rgba(38,51,79,0.16)]" : "";
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
