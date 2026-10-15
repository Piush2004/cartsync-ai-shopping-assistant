'use client';

import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { tokens } from '@/lib/theme/tokens';

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * FadeIn
 * A core motion primitive. Fades an element in slowly and intentionally.
 * Used for large layout blocks and primary images.
 */
export function FadeIn({ delay = 0, duration = tokens.motion.duration.slow, className = '', children, ...props }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: shouldReduceMotion ? 0 : duration, 
        delay: shouldReduceMotion ? 0 : delay, 
        ease: tokens.motion.ease.smooth 
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

