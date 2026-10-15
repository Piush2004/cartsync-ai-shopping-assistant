'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import ChatInterface from '@/components/chat/ChatInterface';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show auth modal if not authenticated (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [loading, user]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden relative">
      {/* Background ambient gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/[0.03] blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/[0.03] blur-[150px]" />
        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Navbar */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 relative z-10">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Sidebar - Mobile Overlay */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 h-full"
            >
              <Sidebar />
            </motion.div>
          </motion.div>
        )}

        {/* Chat Content */}
        <main className="flex-1 min-h-0 p-3 md:p-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <ChatInterface />
          </motion.div>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
