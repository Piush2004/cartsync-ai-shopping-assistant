'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreditBadgeProps {
  className?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [display]);

  return <span>{displayValue}</span>;
}

export default function CreditBadge({ className = '' }: CreditBadgeProps) {
  const { credits } = useAuth();
  const isLow = (credits ?? 0) < 5;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.div
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
          bg-gradient-to-r from-violet-600/30 to-indigo-600/30
          border border-violet-500/20
          backdrop-blur-xl
          cursor-default select-none
        `}
        animate={
          isLow
            ? {
                boxShadow: [
                  '0 0 0px rgba(124,58,237,0)',
                  '0 0 16px rgba(245,158,11,0.3)',
                  '0 0 0px rgba(124,58,237,0)',
                ],
              }
            : {}
        }
        transition={isLow ? { duration: 2, repeat: Infinity } : {}}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.div
          animate={
            isLow
              ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }
              : {}
          }
          transition={
            isLow
              ? { duration: 1.5, repeat: Infinity, repeatDelay: 1 }
              : {}
          }
        >
          <Zap
            className={`w-3.5 h-3.5 ${
              isLow ? 'text-amber-400' : 'text-violet-400'
            }`}
            fill={isLow ? 'currentColor' : 'none'}
          />
        </motion.div>
        <span
          className={`text-sm font-semibold tabular-nums ${
            isLow ? 'text-amber-400' : 'text-[#f5f5f7]'
          }`}
        >
          <AnimatedNumber value={credits ?? 0} />
        </span>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none"
          >
            <div className="px-3 py-1.5 rounded-lg bg-[#1a1a25] border border-white/[0.08] text-xs text-zinc-300 whitespace-nowrap shadow-xl">
              Style Credits remaining
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a25] border-l border-t border-white/[0.08] rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
