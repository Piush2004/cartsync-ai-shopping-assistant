'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

const navLinks = [
  { href: '/dashboard', label: 'Chat' },
  { href: '/studio', label: 'Studio' },
];

export default function Navbar() {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/studio');

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-6 h-6 text-accent-light" />
              </motion.div>
              <span className="text-lg font-bold gradient-text">CartSyncAI</span>
            </Link>

            {/* Center Nav Links (only on dashboard routes) */}
            {isDashboard && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link key={link.href} href={link.href}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                          ${isActive
                            ? 'bg-accent/20 text-accent-light border border-accent/30'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        {link.label}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {!loading && (
                <>
                  {user ? (
                    <div className="hidden md:flex items-center gap-3">
                      {/* User Avatar */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-zinc-300 max-w-[120px] truncate">
                          {user.displayName || user.email}
                        </span>
                      </motion.div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={signOut}
                        icon={<LogOut size={14} />}
                      >
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link href="/auth">
                      <Button variant="primary" size="sm">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 text-zinc-400"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 p-4 md:hidden"
          >
            <div className="glass-strong rounded-2xl p-4 space-y-2">
              {isDashboard &&
                navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-accent/20 text-accent-light'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {link.label}
                      </div>
                    </Link>
                  );
                })}

              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white w-full transition-all"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              ) : (
                <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-accent-light hover:bg-accent/10 transition-all">
                    Sign In
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
