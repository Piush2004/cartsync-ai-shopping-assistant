'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Zap,
  ShoppingBag,
  Ruler,
  TrendingUp,
  Bot,
  Wifi,
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import MessageBubble from '@/components/chat/MessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';
import GatedFeature from '@/components/features/GatedFeature';

const quickActions = [
  { label: 'Find me a dress', icon: ShoppingBag },
  { label: 'What size am I?', icon: Ruler },
  { label: 'Show trending', icon: TrendingUp },
];

export default function ChatInterface() {
  const { messages, sendMessage, isLoading, sessionId } = useChat();
  const { user, credits } = useAuth();
  const { hasEnoughCredits } = useCredits();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    setInputValue('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {/* Online indicator */}
            <motion.div
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0a0a0f]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#f5f5f7]">AI Style Assistant</h2>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="text-[11px] text-green-400">Online</span>
              {sessionId && (
                <span className="text-[11px] text-zinc-600 ml-2">
                  Session: {sessionId.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-[#f5f5f7] tabular-nums">{credits ?? 0}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {isEmpty ? (
          /* Welcome State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center pt-10"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mb-6"
            >
              <Sparkles className="w-10 h-10 text-violet-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-[#f5f5f7] mb-2">
              Welcome to your AI Stylist
            </h3>
            <p className="text-zinc-400 text-sm max-w-[320px] leading-relaxed">
              Hi! I&apos;m your AI stylist. Ask me to find clothes, check sizing, or try on outfits!
            </p>

            {/* Decorative orb */}
            <motion.div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-violet-600/5 blur-[100px]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          </motion.div>
        ) : (
          /* Message List */
          <>
            {messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
          </>
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isLoading && <TypingIndicator />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <AnimatePresence>
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex-shrink-0 flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide"
          >
            {quickActions.map((action, idx) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(124,58,237,0.12)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleQuickAction(action.label)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-300 text-sm hover:border-violet-500/20 transition-colors cursor-pointer"
              >
                <action.icon className="w-4 h-4 text-violet-400" />
                {action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-white/[0.05] p-4">
        <GatedFeature featureName="AI Chat" cost={1}>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your stylist..."
                disabled={isLoading || !hasEnoughCredits(1)}
                className="w-full px-5 py-3.5 pr-14 rounded-xl backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] text-[#f5f5f7] placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all duration-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              />
              {/* Credit cost indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-zinc-600">
                <Zap className="w-3 h-3" />
                <span className="text-[11px]">1</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading || !hasEnoughCredits(1)}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-200 hover:shadow-violet-500/40"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </GatedFeature>
      </div>
    </div>
  );
}
