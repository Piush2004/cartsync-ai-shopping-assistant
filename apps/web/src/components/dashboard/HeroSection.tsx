"use client";

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { ConfidenceRing } from "@/components/ui/ConfidenceRing";
import { staggerContainer, fadeInUp, slideInLeft } from "@/lib/motion";
import { AnimatedCounter } from "@/components/effects/AnimatedCounter";

interface HeroSectionProps {
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    avatar?: string | null;
  };
  email?: string;
  confidence: number;
  recommendationsCount: number;
  completionPercentage: number;
}

export function HeroSection({ user, email, confidence, recommendationsCount, completionPercentage }: HeroSectionProps) {
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  let emoji = "🌙";
  
  if (hour < 12) {
    greeting = "Good Morning";
    emoji = "☀️";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
    emoji = "🌤️";
  }

  // Get name from user object or email
  let displayName = "Guest";
  const userEmail = user?.email || email || "";
  
  if (user?.first_name) {
    displayName = `${user.first_name} ${user.last_name || ''}`.trim();
  } else if (userEmail) {
    const name = userEmail.split('@')[0];
    displayName = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return (
    <motion.div 
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={staggerContainer}
      className="relative mb-12"
    >
      <motion.div variants={fadeInUp} className="flex items-center gap-4">
        {user?.avatar && (
          <img src={user.avatar} alt={displayName} className="w-16 h-16 rounded-full border border-border shadow-sm object-cover" />
        )}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary flex items-center gap-3">
          {greeting}, {displayName}
          <motion.span
            initial={{ rotate: -20, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="inline-block"
          >
            {emoji}
          </motion.span>
        </h1>
      </motion.div>
      <motion.p variants={fadeInUp} className="mt-2 text-lg text-text-secondary">
        Your AI Stylist has analyzed your profile.
      </motion.p>

      <motion.div 
        variants={staggerContainer}
        className="flex flex-wrap gap-4 sm:gap-8 mt-8 items-center"
      >
        {confidence > 0 && (
          <motion.div 
            variants={slideInLeft} 
            whileHover={{ y: -3, boxShadow: "0 0 20px rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)" }}
            className="flex items-center gap-4 bg-bg-card border border-border rounded-full pr-6 p-2 shadow-sm transition-all cursor-default"
          >
            <ConfidenceRing value={confidence} size={48} strokeWidth={4} color="var(--color-accent-emerald)" />
            <div>
              <p className="text-sm font-bold text-text-primary">High Confidence</p>
              <p className="text-xs text-text-muted">Measurement Accuracy</p>
            </div>
          </motion.div>
        )}

        {recommendationsCount > 0 && (
          <motion.div 
            variants={slideInLeft} 
            whileHover={{ y: -3, boxShadow: "0 0 20px rgba(139, 92, 246, 0.15)", borderColor: "rgba(139, 92, 246, 0.3)" }}
            className="flex items-center gap-4 bg-bg-card border border-border rounded-full pr-6 p-2 pl-4 shadow-sm h-[64px] transition-all cursor-default group"
          >
            <div className="w-10 h-10 rounded-full bg-accent-purple/10 flex items-center justify-center border border-accent-purple/20 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">
                <AnimatedCounter value={recommendationsCount} /> New
              </p>
              <p className="text-xs text-text-muted">Recommendations</p>
            </div>
          </motion.div>
        )}

        <motion.div 
          variants={slideInLeft} 
          whileHover={{ y: -3, boxShadow: "0 0 20px rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.3)" }}
          className="flex items-center gap-4 bg-bg-card border border-border rounded-full pr-6 p-2 pl-4 shadow-sm h-[64px] transition-all cursor-default group"
        >
          <div className="w-10 h-10 relative flex items-center justify-center">
            <svg width="40" height="40" className="transform -rotate-90 group-hover:scale-110 transition-transform">
              <circle cx="20" cy="20" r="16" stroke="var(--color-bg-elevated)" strokeWidth="4" fill="transparent" />
              <motion.circle 
                cx="20" cy="20" r="16" stroke="var(--color-accent-blue)" strokeWidth="4" fill="transparent" strokeLinecap="round"
                initial={{ strokeDasharray: "100.5", strokeDashoffset: "100.5" }}
                whileInView={{ strokeDashoffset: 100.5 - (completionPercentage / 100) * 100.5 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              />
            </svg>
            <span className="absolute text-[10px] font-bold">
              <AnimatedCounter value={completionPercentage} suffix="%" />
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Profile Status</p>
            <p className="text-xs text-text-muted">Completion</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
