'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, LogOut, ArrowUpRight, Zap } from 'lucide-react';

interface HeaderProps {
  onOpenUpgradeModal: () => void;
}

export default function Header({ onOpenUpgradeModal }: HeaderProps) {
  const { user, profile, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              CartSync<span className="text-violet-500 font-extrabold">AI</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Multi-Agent Studio</p>
          </div>
        </div>

        {/* Auth & Credit States */}
        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {!loading && profile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/20 px-4 py-2 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
              >
                <Zap className="h-4 w-4 text-violet-400 animate-pulse" />
                <span className="text-sm font-medium text-neutral-300">Style Credits:</span>
                <motion.span 
                  key={profile.credits}
                  initial={{ scale: 1.5, color: '#c084fc' }}
                  animate={{ scale: 1, color: '#a78bfa' }}
                  className="font-bold text-violet-400"
                >
                  {profile.credits}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Account Controls */}
          {!loading && user && (
            <div className="flex items-center gap-3">
              {user.isAnonymous ? (
                <button
                  onClick={onOpenUpgradeModal}
                  className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:shadow-violet-600/30 hover:scale-[1.02]"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    Upgrade Account <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-transform duration-300 group-hover:translate-x-0" />
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="hidden flex-col items-end md:flex">
                    <span className="text-xs font-semibold text-neutral-400">Registered Member</span>
                    <span className="text-[11px] text-neutral-500 truncate max-w-[150px]">{user.email}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
