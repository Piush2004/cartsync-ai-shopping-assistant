"use client";

import { StylistPanel } from "@/components/dashboard/StylistPanel";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { Sparkles } from "lucide-react";
import { AuroraOrb } from "@/components/effects/AuroraOrb";
import Link from "next/link";
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
    <div className="min-h-[calc(100vh-8rem)] bg-bg-primary pb-12 relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <AuroraOrb color="var(--color-accent-blue)" size="600px" blur="100px" className="top-20 left-0 opacity-20 pointer-events-none" />
      <AuroraOrb color="var(--color-accent-purple)" size="500px" blur="80px" className="bottom-0 right-0 opacity-20 pointer-events-none animate-float" />
      
      <div className="w-full flex-1 flex flex-col z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-8"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-blue/20 bg-accent-blue/5 text-accent-blue text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI Powered Consultations</span>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-4xl 2xl:text-5xl font-bold text-text-primary tracking-tight">Your Personal AI Stylist</motion.h1>
          <motion.p variants={fadeInUp} className="text-text-secondary mt-3 text-lg max-w-2xl">
            Ask about sizing, fit advice, or outfit combinations. I know your measurements and style preferences.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px] gap-8 flex-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative min-w-0"
          >
            <div className="relative h-[calc(100vh-17rem)] min-h-[520px] w-full rounded-2xl overflow-hidden border border-border shadow-sm bg-bg-card">
              {sessionToken && <StylistPanel token={sessionToken} />}
            </div>
          </motion.div>

          <aside className="space-y-6 min-w-0 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-border bg-bg-card p-6">
              <h2 className="text-lg font-bold text-text-primary">Questions people ask</h2>
              <ul className="mt-4 space-y-3 text-text-secondary">
                {[
                  "Which size should I buy in Zara?",
                  "What is my chest size?",
                  "I want oversized clothes. What size?",
                  "Is Uniqlo true to size?",
                ].map((q) => (
                  <li key={q} className="rounded-xl bg-bg-secondary px-4 py-3 text-sm leading-snug">{q}</li>
                ))}
              </ul>
            </div>
            <Link href="/try-on" className="block rounded-2xl p-6 text-white silk-accent shadow-sm hover:brightness-110 transition">
              <span className="block text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Found something to buy?</span>
              <span className="block mt-1 text-sm opacity-90">Paste its link and see your size and how it looks on you.</span>
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
