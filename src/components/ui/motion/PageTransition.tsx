'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { tokens } from '@/lib/theme/tokens';

export function PageTransition({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, filter: shouldReduceMotion ? 'none' : 'blur(4px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: shouldReduceMotion ? 'none' : 'blur(4px)' }}
      transition={{ 
        duration: shouldReduceMotion ? 0 : 0.6, 
        ease: tokens.motion.ease.apple 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

