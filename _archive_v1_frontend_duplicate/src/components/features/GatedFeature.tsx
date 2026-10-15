'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Zap, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import Button from '@/components/ui/Button';

interface GatedFeatureProps {
  children: ReactNode;
  cost?: number;
  featureName: string;
  onInsufficientCredits?: () => void;
  fallback?: ReactNode;
}

export default function GatedFeature({
  children,
  cost = 1,
  featureName,
  onInsufficientCredits,
  fallback,
}: GatedFeatureProps) {
  const { user } = useAuth();
  const { credits, hasEnoughCredits } = useCredits();
  const isAuthenticated = !!user;
  const canAccess = isAuthenticated && hasEnoughCredits(cost);

  if (canAccess) {
    return (
      <div className="relative group">
        {children}
        {/* Credit cost tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute -top-8 right-2 pointer-events-none z-20"
        >
          <div className="px-2.5 py-1 rounded-lg bg-violet-600/90 backdrop-blur-sm text-[11px] font-medium text-white flex items-center gap-1 shadow-lg shadow-violet-500/20">
            <Zap className="w-3 h-3" />
            {cost} Credit
          </div>
        </motion.div>
      </div>
    );
  }

  // Determine overlay content
  const isAuthBlocked = !isAuthenticated;

  return (
    <div className="relative">
      {/* Blurred content behind overlay */}
      <div className="blur-[6px] opacity-40 pointer-events-none select-none">
        {fallback || children}
      </div>

      {/* Lock overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <div className="absolute inset-0 backdrop-blur-md bg-black/30 rounded-2xl" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-20 flex flex-col items-center text-center px-8 py-6"
          >
            {isAuthBlocked ? (
              <>
                {/* Sparkle animation ring */}
                <div className="relative mb-4">
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(124,58,237,0.2)',
                        '0 0 40px rgba(124,58,237,0.4)',
                        '0 0 20px rgba(124,58,237,0.2)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center">
                    <LogIn className="w-7 h-7 text-violet-400" />
                  </div>
                  {/* Floating sparkles */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${10 + i * 20}%`,
                        left: `${i === 1 ? 85 : i === 0 ? -15 : 50}%`,
                      }}
                      animate={{
                        y: [-4, 4, -4],
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.1, 0.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    </motion.div>
                  ))}
                </div>
                <h3 className="text-[#f5f5f7] font-semibold text-lg mb-1">
                  Sign in to access
                </h3>
                <p className="text-zinc-400 text-sm mb-4 max-w-[200px]">
                  Unlock {featureName} and more premium features
                </p>
              </>
            ) : (
              <>
                {/* Insufficient credits state */}
                <div className="relative mb-4">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 flex items-center justify-center"
                    animate={{
                      scale: [1, 1.05, 1],
                      borderColor: [
                        'rgba(245,158,11,0.2)',
                        'rgba(245,158,11,0.4)',
                        'rgba(245,158,11,0.2)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Lock className="w-7 h-7 text-amber-400" />
                  </motion.div>
                </div>
                <h3 className="text-[#f5f5f7] font-semibold text-lg mb-1">
                  Insufficient Credits
                </h3>
                <p className="text-zinc-400 text-sm mb-1">
                  This feature requires{' '}
                  <span className="text-violet-400 font-medium">
                    {cost} credit{cost > 1 ? 's' : ''}
                  </span>
                </p>
                <p className="text-zinc-500 text-xs mb-4">
                  You have{' '}
                  <span className="text-amber-400 font-medium">
                    {credits}
                  </span>{' '}
                  remaining
                </p>
                {onInsufficientCredits && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onInsufficientCredits}
                    className="bg-gradient-to-r from-amber-500 to-orange-500"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Get More Credits
                  </Button>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
