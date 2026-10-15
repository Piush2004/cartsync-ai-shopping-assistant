'use client';
import React, { useState, useEffect } from 'react';
import { Camera, Calendar, ArrowRight, Upload, Star, Clock, CheckCircle2, ChevronRight, PieChart, Sparkles, Layers } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { CursorLight, FadeUp, HeroReveal, TextReveal, Stagger, StaggerItem, PremiumCard, GlassReveal, MotionButton, NumberCounter, PageTransition } from '@/components/motion';
import { trackEvent } from '@/lib/analytics';
import { FeedbackPrompt } from '@/components/ui/FeedbackPrompt';
import { Motion, fadeUp, glassReveal, staggerContainer, staggerItem, cardLift, cardPress } from '@/lib/motion';

// --- MOCK DATA ---
const WARDROBE_STATS = {
  mostWornColor: "Black",
  favoriteBrand: "COS",
  mostSaved: "Overshirts",
  mostWornStyle: "Minimal"
};

const MISSING_PIECES = [
  "White Oxford Shirt",
  "Black Relaxed Trousers",
  "Neutral Sneakers"
];

const OUTFIT_CALENDAR = [
  { day: "Monday", event: "Office", match: 94, img: "https://images.unsplash.com/photo-1594938298596-70f594f62bce?q=80&w=400&auto=format&fit=crop" },
  { day: "Tuesday", event: "Dinner", match: 98, img: "https://images.unsplash.com/photo-1593030761757-71fae46af508?q=80&w=400&auto=format&fit=crop" },
  { day: "Wednesday", event: "Travel", match: 91, img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop" }
];

const CAPSULES = [
  { name: "Recently Worn", count: 12 },
  { name: "Favorites", count: 24 },
  { name: "Want to Buy", count: 8 },
  { name: "Travel Capsule", count: 15 },
  { name: "Office Capsule", count: 18 }
];

export default function Wardrobe() {
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);

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
          Analyzing Wardrobe...
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
            <span className="text-[#00FFCC] font-bold">Wardrobe</span>
            <span className="hover:text-white transition-colors cursor-pointer">Style Journey</span>
          </div>
          <Link href="/scan" className="flex items-center justify-center w-10 h-10 bg-white text-black rounded-full hover:bg-[#00FFCC] transition-colors active:scale-95">
            <Camera className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <FeedbackPrompt 
        id="wardrobe_feature" 
        question="Which wardrobe feature do you find most useful?" 
        options={['Capsule switching', 'Outfit ideas', 'Item tracking', 'Fit matching']} 
        delayMs={6000}
      />

      <main className="max-w-7xl mx-auto px-6 pt-16">
        
        {/* HERO */}
        <header className="mb-20">
          <FadeUp delay={0.1}>
            <div className="flex items-center gap-2 text-[#00FFCC] mb-4">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-mono tracking-widest uppercase">Ecosystem</span>
            </div>
          </FadeUp>
          <HeroReveal>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4 leading-none">
              Living <br/> Wardrobe.
            </h1>
          </HeroReveal>
          <TextReveal delay={0.2}>
            <p className="text-gray-400 text-lg font-light tracking-wide">
              78 Items • 4 Capsules
            </p>
          </TextReveal>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* LEFT COLUMN: ANALYSIS & STATS */}
          <div className="lg:col-span-5 space-y-12">
            
            {/* AI WARDROBE ANALYSIS */}
            <GlassReveal 
              delay={0.2}
              className="bg-gradient-to-br from-[#111] to-[#0A0A0A] border border-white/5 p-8 rounded-3xl"
            >
              <h2 className="text-xs font-mono tracking-widest text-[#00FFCC] uppercase mb-8">AI Wardrobe Analysis</h2>
              
              <div className="space-y-6 mb-10">
                <div>
                  <div className="flex justify-between text-sm mb-2"><span className="font-medium">Minimal</span><span className="font-mono text-gray-400">78%</span></div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white w-[78%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2"><span className="font-medium">Sport</span><span className="font-mono text-gray-400">12%</span></div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white/40 w-[12%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2"><span className="font-medium">Formal</span><span className="font-mono text-gray-400">10%</span></div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white/20 w-[10%]" /></div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                <h3 className="text-xl font-bold tracking-tight mb-4">Missing Pieces</h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">Based on your Fit DNA and current items, adding these will unlock 14 new outfit combinations.</p>
                <div className="space-y-3">
                  {MISSING_PIECES.map((piece, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border border-dashed border-gray-500 flex items-center justify-center shrink-0" />
                      <span className="font-light text-gray-200">{piece}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassReveal>

            {/* WARDROBE STATS */}
            <section>
              <FadeUp delay={0.3}>
                <h2 className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-6">Wardrobe Stats</h2>
              </FadeUp>
              <Stagger className="grid grid-cols-2 gap-4">
                {Object.entries(WARDROBE_STATS).map(([key, value]) => (
                  <StaggerItem key={key}>
                    <PremiumCard className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl flex flex-col justify-between aspect-square hover:bg-white/5 transition-colors cursor-default">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-xl font-bold tracking-tight">{value}</div>
                    </PremiumCard>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>

          </div>

          {/* RIGHT COLUMN: CALENDAR, CAPSULES & RATING */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* OUTFIT CALENDAR */}
            <FadeUp delay={0.4}>
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-xs font-mono tracking-widest text-[#00FFCC] uppercase">Outfit Calendar</h2>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase">
                  <Calendar className="w-4 h-4" /> This Week
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                {OUTFIT_CALENDAR.map((item, i) => (
                  <PremiumCard key={i} className="snap-start shrink-0 w-64 group cursor-pointer" enableTilt={true}>
                    <div className="text-sm font-bold mb-1">{item.day}</div>
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">{item.event}</div>
                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10">
                      <Image src={item.img} alt={item.day} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-white/70">Suggested</div>
                        <div className="text-xs font-mono text-[#00FFCC] uppercase">{item.match}% Match</div>
                      </div>
                    </div>
                  </PremiumCard>
                ))}
              </div>
            </FadeUp>

            {/* RATE TODAY'S OUTFIT */}
            <GlassReveal 
              delay={0.5}
              className="relative overflow-hidden rounded-3xl border border-[#00FFCC]/20 bg-[#00FFCC]/5 p-8 md:p-10"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#00FFCC] rounded-full blur-[100px] opacity-10" />
              
              {!showRating ? (
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Rate Today's Fit</h2>
                    <p className="text-gray-400 font-light text-sm max-w-md">Upload a mirror selfie to get instant feedback on your proportions and styling.</p>
                  </div>
                  <MotionButton 
                    onClick={() => setShowRating(true)}
                    className="flex items-center gap-3 bg-white text-black px-6 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#00FFCC] transition-colors shrink-0"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </MotionButton>
                </div>
              ) : (
                <FadeUp className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-32 h-32 rounded-2xl bg-[#111] overflow-hidden relative shrink-0">
                    <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&auto=format&fit=crop" alt="Upload" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-4xl font-black tracking-tighter text-[#00FFCC]">
                        <NumberCounter from={0} to={92} />
                      </div>
                      <div className="text-xs font-mono uppercase tracking-widest text-gray-500">Overall <br/> Score</div>
                    </div>
                    <p className="text-lg font-medium mb-1">Excellent balance.</p>
                    <p className="text-gray-400 font-light text-sm">Your upper frame is well structured. Try darker shoes next time to anchor the look.</p>
                  </div>
                </FadeUp>
              )}
            </GlassReveal>

            {/* MY WARDROBE CAPSULES */}
            <section>
              <FadeUp delay={0.6}>
                <div className="flex justify-between items-end mb-8">
                  <h2 className="text-xs font-mono tracking-widest text-gray-500 uppercase">My Wardrobe</h2>
                  <button className="text-xs font-mono tracking-widest text-white uppercase hover:text-[#00FFCC] transition-colors flex items-center gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </FadeUp>
              
              <Stagger className="space-y-4">
                {CAPSULES.map((capsule, i) => (
                  <StaggerItem key={i}>
                    <PremiumCard 
                      className="group flex items-center justify-between p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                      onClick={() => trackEvent('wardrobe_usage', { capsule: capsule.name })}
                    >
                      <div className="flex items-center gap-4">
                        {i === 0 && <Clock className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />}
                        {i === 1 && <Star className="w-5 h-5 text-gray-500 group-hover:text-[#00FFCC] transition-colors" />}
                        {i > 1 && <Layers className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />}
                        <span className="font-bold text-lg tracking-tight group-hover:translate-x-1 transition-transform">{capsule.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-500">
                        <span className="font-mono text-sm">{capsule.count} Items</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </PremiumCard>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>

          </div>
        </div>
      </main>
      
      {/* Footer Nav Space */}
      <div className="h-24"></div>
    </div>
  );
}
