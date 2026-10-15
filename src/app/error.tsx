'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { MotionButton, FadeUp, HeroReveal } from '@/components/motion';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our analytics layer
    console.error('Route Error:', error);
    trackEvent('camera_guidance_failed', { error_message: error.message, stack: error.stack });
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/30"
      >
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </motion.div>

      <HeroReveal className="mb-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          Something went wrong
        </h1>
      </HeroReveal>

      <FadeUp className="max-w-md mb-12">
        <p className="text-gray-400 font-light text-lg">
          An error occurred in this view. We've recorded the issue.
        </p>
      </FadeUp>

      <MotionButton 
        onClick={() => reset()}
        className="px-8 py-4 rounded-full font-black uppercase tracking-widest flex items-center gap-3"
      >
        <RefreshCcw className="w-5 h-5" />
        Try Again
      </MotionButton>
    </div>
  );
}
