"use client";

import { Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, slideInLeft } from "@/lib/motion";
import { AuroraOrb } from "@/components/effects/AuroraOrb";
import { TypewriterText } from "@/components/effects/TypewriterText";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Dynamic Background */}
      <AuroraOrb color="var(--color-accent-blue)" size="800px" blur="120px" className="-top-40 -left-40 opacity-40" />
      <AuroraOrb color="var(--color-accent-purple)" size="600px" blur="100px" className="-bottom-40 -right-20 opacity-30 animate-float" />
      
      {/* Left Panel (Branding) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 z-10">
        <div>
          <Link href="/" className="flex items-center gap-2 group w-max">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              whileHover={{ scale: 1.2, rotate: 0, transition: { duration: 0.2 } }}
            >
              <Sparkles className="w-6 h-6 text-accent-blue group-hover:text-accent-purple transition-colors" />
            </motion.div>
            <span className="font-bold text-2xl tracking-tight text-text-primary">CartSync</span>
          </Link>
        </div>

        <motion.div 
          className="relative z-10 my-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={slideInLeft} className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-text-primary leading-tight mb-2">
              <TypewriterText text="AI-powered sizing" delay={0.2} speed={50} />
            </h1>
            <h1 className="text-5xl font-bold tracking-tight text-text-secondary leading-tight">
              that actually works.
            </h1>
          </motion.div>
          
          <div className="space-y-6">
            {[
              "Deterministic measurement engine",
              "Brand-specific sizing logic",
              "Conversational style assistant"
            ].map((feature, i) => (
              <motion.div key={i} variants={slideInLeft} className="flex items-center gap-3 text-text-secondary group">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-blue/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CheckCircle2 className="w-5 h-5 text-accent-blue relative z-10" />
                </div>
                <span className="text-lg group-hover:text-text-primary transition-colors">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 bg-bg-card/40 backdrop-blur-xl border border-border p-6 rounded-2xl max-w-md shadow-xl shadow-accent-purple/5">
          <p className="text-text-primary text-sm italic mb-4">
            "CartSync finally solved the problem of buying clothes online. It's like having a tailor who knows every brand's sizing chart by heart."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-accent p-[1px]">
              <div className="w-full h-full bg-bg-primary rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold">SJ</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Sarah J.</p>
              <p className="text-xs text-text-muted">Early Adopter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-full max-w-md bg-bg-card/60 backdrop-blur-2xl border border-border p-10 rounded-3xl shadow-2xl shadow-accent-blue/5"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
