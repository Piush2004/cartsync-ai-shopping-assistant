'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  glowOnHover?: boolean;
}

export default function Card({
  children,
  className = '',
  hoverable = true,
  glowOnHover = false,
}: CardProps) {
  return (
    <motion.div
      whileHover={
        hoverable
          ? {
              scale: 1.02,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      className={`
        glass rounded-2xl p-6
        transition-all duration-300
        ${hoverable ? 'cursor-pointer' : ''}
        ${glowOnHover ? 'hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
