"use client";

import { StylistPanel } from "@/components/dashboard/StylistPanel";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { Sparkles } from "lucide-react";
import { AuroraOrb } from "@/components/effects/AuroraOrb";
import { useEffect, useState } from "react";
import { getToken } from "@/app/actions/auth";

export default function StylistPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // Reads the real auth token (httpOnly cookie via the server action).
    const fetchToken = async () => {
      try {
        const t = await getToken();
        setSessionToken(t);
      } catch (e) {
        // getToken() reading a cookie essentially never throws, but if it
        // ever does, falling back to a fake "demo-token" string (the old
        // behavior here) would let StylistPanel make real API calls with a
        // credential that isn't real, failing confusingly downstream
        // instead of clearly. Leave sessionToken null; StylistPanel/the
        // page below already handles the unauthenticated case.
        console.error("Failed to read auth token", e);
      }
    };
    fetchToken();
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-12 px-6 relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <AuroraOrb color="var(--color-accent-blue)" size="600px" blur="100px" className="top-20 left-0 opacity-20 pointer-events-none" />
      <AuroraOrb color="var(--color-accent-purple)" size="500px" blur="80px" className="bottom-0 right-0 opacity-20 pointer-events-none animate-float" />
      
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-8"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-blue/20 bg-accent-blue/5 text-accent-blue text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI Powered Consultations</span>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-4xl font-bold text-text-primary tracking-tight">Your Personal AI Stylist</motion.h1>
          <motion.p variants={fadeInUp} className="text-text-secondary mt-3 text-lg max-w-xl mx-auto">
            Ask about sizing, fit advice, or outfit combinations. I know your measurements and style preferences.
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.2, delay: 0.2 }}
          className="flex-1 w-full relative"
        >
          <div className="absolute inset-0 bg-gradient-card rounded-[2rem] shadow-xl shadow-accent-blue/5 -m-2 opacity-50 border border-border" />
          <div className="relative h-[600px] w-full rounded-2xl overflow-hidden shadow-sm">
            {sessionToken && <StylistPanel token={sessionToken} />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
