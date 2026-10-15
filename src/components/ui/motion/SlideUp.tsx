'use client';

import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { tokens } from '@/lib/theme/tokens';

interface SlideUpProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * SlideUp
 * Translates an element upwards while fading it in.
 * Designed to feel confident and elegant. No bouncy springs.
 */
export function SlideUp({ delay = 0, duration = tokens.motion.duration.slow, yOffset = 20, className = '', children, ...props }: SlideUpProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : yOffset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : yOffset * -1 }}
      transition={{ 
        duration: shouldReduceMotion ? 0 : duration, 
        delay: shouldReduceMotion ? 0 : delay, 
        ease: tokens.motion.ease.apple 
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
