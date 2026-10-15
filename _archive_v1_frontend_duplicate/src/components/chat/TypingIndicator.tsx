'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -6 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="flex items-end gap-2.5 max-w-[120px]"
    >
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* Typing Bubble */}
      <div className="backdrop-blur-xl bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 0.4,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
            className="block w-2 h-2 rounded-full bg-violet-400/70"
          />
        ))}
      </div>
    </motion.div>
  );
}
