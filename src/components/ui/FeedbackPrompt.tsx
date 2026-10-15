'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Motion } from '@/lib/motion';

interface FeedbackPromptProps {
  id: string;
  question: string;
  options: string[];
  delayMs?: number;
  onComplete?: () => void;
}

export function FeedbackPrompt({ id, question, options, delayMs = 2000, onComplete }: FeedbackPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    // Check if already answered this specific prompt
    if (localStorage.getItem(`feedback_${id}`)) return;

    const timer = setTimeout(() => setIsVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [id, delayMs]);

  const handleSelect = (option: string) => {
    trackEvent('feedback_submitted', { promptId: id, answer: option });
    localStorage.setItem(`feedback_${id}`, 'true');
    setHasAnswered(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 1500);
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(`feedback_${id}`, 'dismissed');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: Motion.duration.normal, ...Motion.ease.springSnappy }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[#111] border border-white/10 p-6 rounded-[2rem] shadow-2xl z-50 backdrop-blur-xl"
        >
          {!hasAnswered ? (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h4 className="text-white font-bold tracking-tight pr-4">{question}</h4>
                <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 font-medium transition-colors border border-transparent hover:border-white/10"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col items-center justify-center py-4"
            >
              <CheckCircle2 className="w-12 h-12 text-[#00FFCC] mb-2" />
              <p className="text-white font-bold tracking-tight text-center">Thank you!</p>
              <p className="text-gray-400 text-sm text-center">Your feedback shapes the AI.</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
