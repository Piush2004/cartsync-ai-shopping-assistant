'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'signin' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [displayName, setDisplayName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const resetForm = () => {
    setSignInEmail('');
    setSignInPassword('');
    setDisplayName('');
    setSignUpEmail('');
    setSignUpPassword('');
    setConfirmPassword('');
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleTabSwitch = (tab: AuthTab) => {
    setActiveTab(tab);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await signInWithEmail(signInEmail, signInPassword);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !signUpEmail || !signUpPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await signUpWithEmail(signUpEmail, signUpPassword, displayName);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'w-full px-4 py-3 pl-11 bg-white/[0.05] border border-white/[0.1] rounded-xl text-[#f5f5f7] placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all duration-300 text-sm';

  const tabVariants = {
    inactive: { opacity: 0.5 },
    active: { opacity: 1 },
  };

  const formVariants = {
    hidden: { opacity: 0, x: 20, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: {
      opacity: 0,
      x: -20,
      filter: 'blur(4px)',
      transition: { duration: 0.25 },
    },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="px-2 pb-2">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-500/20"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-2xl font-bold text-[#f5f5f7]"
          >
            Welcome to <span className="gradient-text">CartSyncAI</span>
          </motion.h2>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-zinc-400 text-sm mt-1"
          >
            Your AI-powered fashion assistant
          </motion.p>
        </div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative flex bg-white/[0.04] rounded-xl p-1 mb-6"
        >
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-violet-600/80 to-indigo-600/80 shadow-lg shadow-violet-500/10"
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              left: activeTab === 'signin' ? '4px' : '50%',
              width: 'calc(50% - 4px)',
            }}
          />
          {(['signin', 'signup'] as AuthTab[]).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => handleTabSwitch(tab)}
              variants={tabVariants}
              animate={activeTab === tab ? 'active' : 'inactive'}
              className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === tab ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {tab === 'signin' ? 'Sign In' : 'Sign Up'}
            </motion.button>
          ))}
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'signin' ? (
            <motion.div
              key="signin"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Google Sign In */}
              <Button
                variant="ghost"
                size="lg"
                className="w-full mb-4 bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.12] h-12"
                onClick={handleGoogleSignIn}
                loading={isSubmitting}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs text-zinc-500 bg-[#13131a]">or</span>
                </div>
              </div>

              {/* Email Sign In Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20"
                  loading={isSubmitting}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20"
                  loading={isSubmitting}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Account
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-zinc-500 mt-6"
        >
          By continuing, you agree to CartSyncAI&apos;s Terms of Service and Privacy Policy.
        </motion.p>
      </div>
    </Modal>
  );
}
