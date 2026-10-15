'use client';
import React, { useState, useEffect } from 'react';
import { Camera, ArrowRight, History, Compass, ChevronRight, Activity, Calendar, Zap, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { CursorLight, FadeUp, HeroReveal, TextReveal, Stagger, StaggerItem, PremiumCard, GlassReveal, MotionButton, NumberCounter, PageTransition } from '@/components/motion';
import { Motion, fadeUp, glassReveal, staggerContainer, staggerItem, cardLift, cardPress } from '@/lib/motion';

// --- MOCK DATA ---
const EVOLUTION_STATS = [
  { label: "Minimal Fit", value: "+18%", trend: "up", color: "text-[#00FFCC]", numValue: 18, prefix: '+' },
  { label: "Sport Aesthetic", value: "-12%", trend: "down", color: "text-red-400", numValue: 12, prefix: '-' },
  { label: "Neutral Colors", value: "+32%", trend: "up", color: "text-[#00FFCC]", numValue: 32, prefix: '+' },
];

const STYLE_TIMELINE = [
  { month: "January", event: "Built Fit Identity", detail: "Initial proportions recorded." },
  { month: "February", event: "Added Travel Capsule", detail: "Focused on lightweight linen." },
  { month: "April", event: "Style shifted toward Minimal", detail: "Began favoring unstructured silhouettes." },
  { month: "May", event: "Started buying relaxed fits", detail: "Waist preferences shifted +2cm for comfort." },
];

const STYLE_GOALS = [
  { title: "Build a minimalist wardrobe", active: true },
  { title: "Dress more formally for work", active: false },
  { title: "Travel lighter (Capsules)", active: true },
  { title: "Experiment with earth tones", active: false }
];

export default function Journey() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: Motion.duration.cinematic, repeat: Infinity }}
          className="text-sm font-mono tracking-widest uppercase text-[#00FFCC]"
        >
          Analyzing Evolution...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] pb-24 font-sans selection:bg-[#00FFCC] selection:text-black">
      <CursorLight />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            CartSync <span className="text-[#00FFCC]">AI</span>
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-mono tracking-widest uppercase text-gray-500">
            <Link href="/discover" className="hover:text-white transition-colors">Fit Identity</Link>
            <Link href="/discover" className="hover:text-white transition-colors">AI Stylist</Link>
            <Link href="/wardrobe" className="hover:text-white transition-colors">Wardrobe</Link>
            <span className="text-[#00FFCC] font-bold">Style Journey</span>
          </div>
          <Link href="/scan" className="flex items-center justify-center w-10 h-10 bg-white text-black rounded-full hover:bg-[#00FFCC] transition-colors active:scale-95">
            <Camera className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-16">
        
        {/* HERO */}
        <header className="mb-20">
          <FadeUp delay={0.1}>
            <div className="flex items-center gap-2 text-[#00FFCC] mb-4">
              <History className="w-4 h-4" />
              <span className="text-xs font-mono tracking-widest uppercase">Evolution</span>
            </div>
          </FadeUp>
          <HeroReveal>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4 leading-none">
              Style <br/> Evolution.
            </h1>
          </HeroReveal>
          <TextReveal delay={0.2}>
            <p className="text-gray-400 text-lg font-light tracking-wide max-w-xl">
              A living record of your fashion journey. Watch how your preferences, proportions, and tastes evolve over time.
            </p>
          </TextReveal>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* TOP ROW: AI REFLECTION & FIT SESSION AGING */}
          <div className="lg:col-span-8">
            <GlassReveal 
              delay={0.2}
              className="bg-gradient-to-r from-[#111] to-[#0A0A0A] border border-white/5 p-10 md:p-12 rounded-3xl h-full flex flex-col justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFCC] rounded-full blur-[120px] opacity-10" />
              <h2 className="text-xs font-mono tracking-widest text-[#00FFCC] uppercase mb-6 relative z-10">AI Reflection</h2>
              <p className="text-2xl md:text-3xl font-light leading-relaxed relative z-10 text-gray-200">
                Over the last three months, you've consistently preferred <span className="text-white font-bold">clean silhouettes</span> and <span className="text-white font-bold">neutral colors</span>. Your wardrobe has become vastly more cohesive, and your outfit ratings have improved by 11%.
              </p>
            </GlassReveal>
          </div>

          <div className="lg:col-span-4">
            <FadeUp 
              delay={0.3}
              className="bg-[#050505] border border-white/10 p-10 rounded-3xl h-full flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-8">Fit Session Age</h2>
                <div className="text-6xl font-black tracking-tighter text-white mb-2">
                  <NumberCounter from={0} to={182} />
                  <span className="text-2xl text-gray-500">d</span>
                </div>
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                  <Activity className="w-4 h-4" /> Accuracy Decreasing
                </div>
              </div>
              
              <div className="mt-12">
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">Your proportions may have changed. Refresh your Fit Session for perfect recommendations.</p>
                <MotionButton className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-[#00FFCC] transition-colors">
                  Refresh Profile
                </MotionButton>
              </div>
            </FadeUp>
          </div>

          {/* MIDDLE ROW: EVOLUTION CARDS & STYLE GOALS */}
          <div className="lg:col-span-6">
            <section>
              <FadeUp delay={0.4}>
                <h2 className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-6">Your Style Has Evolved</h2>
              </FadeUp>
              <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {EVOLUTION_STATS.map((stat, i) => (
                  <StaggerItem key={i}>
                    <PremiumCard className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl flex flex-col justify-center h-full">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-4">{stat.label}</div>
                      <div className={`text-3xl font-black tracking-tighter ${stat.color}`}>
                        <NumberCounter from={0} to={stat.numValue} prefix={stat.prefix} suffix="%" />
                      </div>
                    </PremiumCard>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          </div>

          <div className="lg:col-span-6">
            <GlassReveal 
              delay={0.5}
              className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl"
            >
              <h2 className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-6">Active Style Goals</h2>
              <Stagger className="space-y-4">
                {STYLE_GOALS.map((goal, i) => (
                  <StaggerItem key={i}>
                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${goal.active ? 'bg-[#00FFCC] border-[#00FFCC]' : 'border-gray-600 group-hover:border-gray-400'}`}>
                        {goal.active && <div className="w-2 h-2 bg-black rounded-full" />}
                      </div>
                      <span className={`text-sm ${goal.active ? 'text-white font-medium' : 'text-gray-500 font-light'}`}>{goal.title}</span>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </GlassReveal>
          </div>

          {/* BOTTOM LEFT: TIMELINE & JOURNAL */}
          <div className="lg:col-span-7 space-y-12">
            <section>
              <FadeUp delay={0.6}>
                <h2 className="text-xs font-mono tracking-widest text-[#00FFCC] uppercase mb-8">The Journey</h2>
              </FadeUp>
              <Stagger className="relative pl-6 border-l border-white/10 space-y-12">
                {STYLE_TIMELINE.map((item, i) => (
                  <StaggerItem key={i}>
                    <div className="relative">
                      <div className="absolute -left-[29px] top-1 w-3 h-3 bg-black border-2 border-[#00FFCC] rounded-full shadow-[0_0_10px_#00FFCC]" />
                      <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">{item.month}</div>
                      <div className="text-xl font-bold tracking-tight mb-1">{item.event}</div>
                      <div className="text-sm text-gray-400 font-light">{item.detail}</div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>

            {/* FASHION JOURNAL */}
            <GlassReveal 
              delay={0.7}
              className="bg-[#111] border border-white/5 p-8 rounded-3xl"
            >
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00FFCC] uppercase mb-8">
                <BookOpen className="w-4 h-4" /> Fashion Journal
              </div>
              
              <div className="border-l-2 border-[#00FFCC]/20 pl-6 py-2">
                <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Today</div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-2xl font-bold">Weekend Coffee Run</div>
                  <div className="px-3 py-1 rounded-full bg-[#00FFCC]/10 text-[#00FFCC] text-xs font-mono uppercase tracking-widest">AI Rating 94</div>
                </div>
                <p className="text-gray-300 font-light leading-relaxed italic">
                  "The relaxed overshirt complemented your shoulder profile particularly well. A great example of playing to your Fit DNA strengths."
                </p>
              </div>
            </GlassReveal>
          </div>

          {/* BOTTOM RIGHT: WARDROBE GROWTH & COMMUNITY */}
          <div className="lg:col-span-5 space-y-12">
            
            {/* WARDROBE GROWTH */}
            <FadeUp 
              delay={0.8}
              className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl"
            >
              <h2 className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-8">Wardrobe Growth</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
                    <span>January</span>
                    <span>24 Items</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`h-2 flex-1 rounded-full ${i < 3 ? 'bg-gray-600' : 'bg-white/5'}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono text-[#00FFCC] uppercase tracking-widest mb-2">
                    <span>Today</span>
                    <span>78 Items</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`h-2 flex-1 rounded-full ${i < 9 ? 'bg-[#00FFCC]' : 'bg-white/5'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* COMMUNITY INSIGHTS (SPRINT 6.5) */}
            <GlassReveal 
              delay={0.9}
              className="relative overflow-hidden rounded-3xl border border-[#00FFCC]/20 bg-[#00FFCC]/5 p-8"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00FFCC] rounded-full blur-[80px] opacity-20" />
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00FFCC] uppercase mb-6 relative z-10">
                <Users className="w-4 h-4" /> Community Insights
              </div>
              <p className="text-lg font-medium leading-relaxed mb-6 relative z-10">
                <span className="text-[#00FFCC] font-bold">74%</span> of users with an <span className="font-bold border-b border-dashed border-white/30 pb-0.5">Athletic Contemporary</span> profile preferred relaxed trousers this month.
              </p>
              <button className="text-xs font-mono tracking-widest text-white uppercase hover:text-[#00FFCC] transition-colors flex items-center gap-1 relative z-10">
                Explore Public Style Boards <ArrowRight className="w-3 h-3" />
              </button>
            </GlassReveal>

          </div>

        </div>
      </main>
      
      <div className="h-24"></div>
    </div>
  );
}
