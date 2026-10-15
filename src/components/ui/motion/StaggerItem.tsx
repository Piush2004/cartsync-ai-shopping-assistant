'use client';

import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { tokens } from '@/lib/theme/tokens';

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  yOffset?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * StaggerItem
 * Must be used as a direct child of StaggerContainer.
 * Slides up and fades in, governed by the parent's timing.
 */
export function StaggerItem({ yOffset = 20, className = '', children, ...props }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : yOffset },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { ease: tokens.motion.ease.apple, duration: shouldReduceMotion ? 0 : tokens.motion.duration.slow }
        },
        exit: { 
          opacity: 0, 
          y: shouldReduceMotion ? 0 : yOffset * -1,
          transition: { ease: tokens.motion.ease.apple, duration: shouldReduceMotion ? 0 : tokens.motion.duration.base }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

