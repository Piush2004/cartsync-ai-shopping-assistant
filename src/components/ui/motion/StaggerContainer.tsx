'use client';

import { motion, HTMLMotionProps } from 'framer-motion';

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * StaggerContainer
 * Parent component that orchestrates its children to animate sequentially.
 * Use with StaggerItem as direct children.
 */
export function StaggerContainer({ 
  staggerDelay = 0.1, 
  delayChildren = 0, 
  className = '', 
  children, 
  ...props 
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayChildren
          }
        },
        exit: {
          transition: {
            staggerChildren: staggerDelay / 2,
            staggerDirection: -1
          }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
