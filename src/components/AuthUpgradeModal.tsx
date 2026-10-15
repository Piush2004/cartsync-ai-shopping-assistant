'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, ShieldCheck, Loader2 } from 'lucide-react';

interface AuthUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthUpgradeModal({ isOpen, onClose }: AuthUpgradeModalProps) {
  const { upgradeAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await upgradeAccount(email, password);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upgrade account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {success ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4 animate-bounce">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Account Upgraded!</h3>
                <p className="text-sm text-neutral-400">
                  Your style credits and preferences are now secured under your email credential.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">Upgrade Profile</h3>
                  <p className="text-sm text-neutral-400">
                    Secure your 30 style credits and gain permanent access by creating password credentials.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Upgrading...
                      </>
                    ) : (
                      'Secure My Account'
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
