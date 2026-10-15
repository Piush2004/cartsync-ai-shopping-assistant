'use client';
import React, { useState, useEffect } from 'react';
import { Camera, ArrowRight, User, History, Compass, Check, ChevronRight, ScanLine, Scan, Sparkles, MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { trackEvent } from '@/lib/analytics';
import { FeedbackPrompt } from '@/components/ui/FeedbackPrompt';

import { 
  CursorLight, FadeUp, FadeIn, TextReveal, HeroReveal, Stagger, StaggerItem, 
  PremiumCard, GlassReveal, BlurReveal, MotionButton, NumberCounter, GlassSkeleton, PageTransition 
} from '@/components/motion';
import { 
  Motion, fadeUp, fadeIn, scaleIn, glassReveal, cardLift, cardPress, staggerContainer, staggerItem 
} from '@/lib/motion';

// --- MOCK DATA FOR FIT IDENTITY ---
const FIT_PASSPORT = { id: "CTS-20384", profile: "Athletic Contemporary", primarySize: "M", confidence: "98%", created: "20 JUL 2026" };
const FIT_DNA = { upperFrame: "Balanced", shoulders: "Athletic", torso: "Modern", waist: "Slim", posture: "Neutral" };
const STYLE_FOUNDATION = ["Structured Tops", "Relaxed Bottoms", "Layer-Friendly", "Minimalist Silhouettes"];
const MEASUREMENT_STORY = "Your upper body proportions are highly balanced, making you a strong match for modern slim and regular fits. Your shoulders fall comfortably within medium sizing, while your waist sits near the transition between M and L depending on the brand.";
const SIZE_REASONING = ["Shoulder width is ideal", "Chest aligns perfectly", "Waist is within tolerance", "Sleeves fit comfortably"];
const CONFIDENCE_TIMELINE = [
  { stage: 'Capture', confidence: 100 }, { stage: 'Pose', confidence: 99 }, { stage: 'Depth', confidence: 97 },
  { stage: 'Measurements', confidence: 98 }, { stage: 'Recommendations', confidence: 98 }
];

export default function Discover() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'FIT_IDENTITY' | 'CURATED'>('CURATED');
  
  // Fit Identity States
  const [passportFlipped, setPassportFlipped] = useState(false);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // Time-based greeting
  const [greeting, setGreeting] = useState('Good Evening');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white p-8">
        <div className="w-full max-w-md">
          <GlassSkeleton lines={3} className="mb-4" />
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: Motion.duration.slower, repeat: Infinity }}
            className="text-sm font-mono tracking-widest uppercase text-[#00FFCC] text-center"
          >
            Curating Your Feed...
          </motion.div>
        </div>
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
            <button 
              onClick={() => setActiveTab('FIT_IDENTITY')}
              className={`transition-colors ${activeTab === 'FIT_IDENTITY' ? 'text-white font-bold' : 'hover:text-white'}`}
            >
              Fit Identity
            </button>
            <button 
              onClick={() => setActiveTab('CURATED')}
              className={`transition-colors ${activeTab === 'CURATED' ? 'text-[#00FFCC] font-bold' : 'hover:text-white'}`}
            >
              Curated
            </button>
            <button className="hover:text-white transition-colors">Style Journey</button>
          </div>
          <Link href="/scan" className="flex items-center justify-center w-10 h-10 bg-white text-black rounded-full hover:bg-[#00FFCC] transition-colors active:scale-95">
            <Camera className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-16">
        <AnimatePresence mode="wait">
          
          {/* =========================================
              TAB: CURATED (AI STYLIST EXPERIENCE)
          ========================================= */}
          {activeTab === 'CURATED' && (
            <motion.div 
              key="curated"
              initial="hidden" animate="visible" exit="exit" variants={fadeUp}
              className="space-y-24"
            >
              
              {/* HEADER */}
              <header className="mb-12">
                <HeroReveal>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">{greeting}, Piush.</h1>
                </HeroReveal>
                <TextReveal delay={0.2}>
                  <p className="text-gray-400 text-lg font-light tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00FFCC]" />
                    Your Personal Fashion Intelligence
                  </p>
                </TextReveal>
              </header>

              {/* AI INSIGHT */}
              <GlassReveal>
                <section className="bg-gradient-to-r from-[#111] to-[#0A0A0A] border border-white/5 rounded-3xl p-10 md:p-16 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFCC] rounded-full blur-[120px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000" />
                  <div className="text-xs font-mono tracking-widest text-[#00FFCC] uppercase mb-8 relative z-10">Today's Fit Insight</div>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl leading-tight relative z-10">
                    Your shoulder proportions work exceptionally well with structured overshirts.
                  </h2>
                </section>
              </GlassReveal>

              {/* OUTFIT STORY */}
              <section>
                <div className="flex justify-between items-end mb-8">
                  <div className="text-xs font-mono tracking-widest text-gray-500 uppercase">Your Perfect Outfit</div>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                  <FadeUp className="md:w-1/2 aspect-[4/5] relative rounded-3xl overflow-hidden group">
                    <Image src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop" alt="Outfit" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-8 left-8">
                      <h3 className="text-3xl font-black tracking-tighter uppercase mb-2 text-white">Weekend Coffee Run</h3>
                      <p className="text-gray-300 font-light">Relaxed silhouette balanced by your upper frame.</p>
                    </div>
                  </FadeUp>
                  
                  <Stagger className="md:w-1/2 flex flex-col gap-4">
                    {/* Outfit Builder Items */}
                    {[
                      { name: 'Oversized Technical Shirt', brand: 'COS', price: '$89', match: '99%' },
                      { name: 'Relaxed Wide Trousers', brand: 'Arket', price: '$119', match: '96%' },
                      { name: 'Heavyweight Basic Tee', brand: 'Uniqlo U', price: '$25', match: '98%' }
                    ].map((item, i) => (
                      <StaggerItem key={i}>
                        <MotionButton 
                          className="w-full mt-4 flex items-center justify-between px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 group transition-all"
                          onClick={() => trackEvent('fit_identity_viewed')}
                        >
                          <div className="w-16 h-16 bg-white/5 rounded-xl flex-shrink-0" />
                          <div className="flex-grow text-left ml-4">
                            <div className="font-bold text-lg">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.brand} • {item.price}</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-xs font-mono text-[#00FFCC] uppercase tracking-widest mb-1">Match</div>
                            <div className="font-black text-xl">{item.match}</div>
                          </div>
                        </MotionButton>
                      </StaggerItem>
                    ))}
                    <MotionButton variant="ghost" className="mt-4 py-4 rounded-full border border-white/10 text-xs font-mono tracking-widest uppercase hover:bg-white hover:text-black transition-colors w-full">
                      Swap Items
                    </MotionButton>
                  </Stagger>
                </div>
              </section>

              {/* BRAND DISCOVERY */}
              <section>
                <div className="text-center mb-12">
                  <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-4">Brand Discovery</div>
                  <h3 className="text-2xl font-bold tracking-tight">Because you prefer minimalist fits</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['COS', 'ARKET', 'UNIQLO U'].map((brand) => (
                    <PremiumCard key={brand} className="aspect-video bg-[#111] rounded-3xl border border-white/5 flex items-center justify-center cursor-pointer">
                      <span className="text-3xl font-serif italic tracking-widest opacity-80">{brand}</span>
                    </PremiumCard>
                  ))}
                </div>
              </section>

              {/* PRODUCT FEED (NEW DROPS) */}
              <section>
                <div className="text-xs font-mono tracking-widest text-[#00FFCC] uppercase mb-8">New Arrivals for your Fit DNA</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Product Card 1 */}
                  <PremiumCard className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer">
                    <Image src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop" alt="Jacket" fill className="object-cover transition-transform" style={{ transitionDuration: `${Motion.duration.slower}s` }} />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 flex flex-col justify-between p-8" style={{ transition: `opacity ${Motion.duration.normal}s cubic-bezier(${[...Motion.ease.standard].join(',')})` }}>
                      <div className="flex justify-between items-start">
                        <div className="font-black text-2xl uppercase tracking-tighter">Nike Tech <br/> Knit Jacket</div>
                        <div className="flex flex-col items-end">
                          <div className="text-[10px] font-mono text-[#00FFCC] uppercase tracking-widest mb-1">AI Match</div>
                          <div className="font-black text-2xl text-[#00FFCC]">97%</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-white mb-4">Why this works</div>
                        <div className="space-y-3">
                          {['Balances your shoulders', 'Creates a cleaner silhouette', 'Works with your torso'].map((reason, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full bg-[#00FFCC]/20 flex items-center justify-center shrink-0">
                                <Check className="w-2 h-2 text-[#00FFCC]" />
                              </div>
                              <span className="text-sm font-light text-gray-200">{reason}</span>
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-[#00FFCC] transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </PremiumCard>

                  {/* Product Card 2 */}
                  <PremiumCard className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer">
                    <Image src="https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop" alt="Pants" fill className="object-cover transition-transform" style={{ transitionDuration: `${Motion.duration.slower}s` }} />
                    
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 flex flex-col justify-between p-8" style={{ transition: `opacity ${Motion.duration.normal}s cubic-bezier(${[...Motion.ease.standard].join(',')})` }}>
                      <div className="flex justify-between items-start">
                        <div className="font-black text-2xl uppercase tracking-tighter">Wide Leg <br/> Trouser</div>
                        <div className="flex flex-col items-end">
                          <div className="text-[10px] font-mono text-[#00FFCC] uppercase tracking-widest mb-1">AI Match</div>
                          <div className="font-black text-2xl text-[#00FFCC]">94%</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-white mb-4">Why this works</div>
                        <div className="space-y-3">
                          {['Ideal for your waist size', 'Relaxed fit matches preference', 'Perfect break length'].map((reason, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full bg-[#00FFCC]/20 flex items-center justify-center shrink-0">
                                <Check className="w-2 h-2 text-[#00FFCC]" />
                              </div>
                              <span className="text-sm font-light text-gray-200">{reason}</span>
                            </div>
                          ))}
                        </div>
                        <button className="w-full mt-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-[#00FFCC] transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </PremiumCard>

                  {/* Style Lesson Card */}
                  <PremiumCard className="aspect-[3/4] rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 flex flex-col justify-between cursor-pointer">
                    <div className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Style Lesson</div>
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight mb-4 leading-tight">Why shoulder width matters more than chest for jackets.</h3>
                      <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </PremiumCard>
                </div>
              </section>

              {/* COLLECTIONS */}
              <section className="overflow-hidden pb-12">
                <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-8">Collections</div>
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4 px-2 -mx-2">
                  {['Minimal Everyday', 'Summer Linen', 'Travel Ready', 'Work Essentials', 'Weekend Relaxed'].map((collection) => (
                    <PremiumCard key={collection} className="snap-start shrink-0 w-64 h-32 bg-gradient-to-br from-[#1a1a1a] to-black border border-white/5 rounded-2xl flex items-center justify-center cursor-pointer">
                      <span className="font-bold tracking-wide">{collection}</span>
                    </PremiumCard>
                  ))}
                </div>
              </section>

              {/* AI STYLIST STICKY CHAT */}
              <div className="sticky bottom-6 w-full max-w-2xl mx-auto z-40">
                <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-2 rounded-full flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-gray-500" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ask your AI Stylist..." 
                    className="flex-grow bg-transparent border-none outline-none px-4 text-sm font-light text-white placeholder-gray-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        trackEvent('stylist_prompt', { query: e.currentTarget.value });
                      }
                    }}
                  />
                  <motion.button 
                    whileTap={cardPress}
                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:bg-[#00FFCC] transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

            </motion.div>
          )}

          {/* =========================================
              TAB: FIT IDENTITY (SPRINT 3)
          ========================================= */}
          {activeTab === 'FIT_IDENTITY' && (
            <motion.div 
              key="fit_identity"
              initial="hidden" animate="visible" exit="exit" variants={fadeUp}
            >
              <header className="mb-24 text-center flex flex-col items-center">
                <div className="w-full max-w-2xl border-t border-white/10 mb-8" />
                <HeroReveal>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 leading-none">
                    Your Fit <br/> <span className="text-[#00FFCC]">Identity.</span>
                  </h1>
                </HeroReveal>
                <div className="flex flex-wrap justify-center gap-6 text-xs font-mono tracking-widest uppercase text-gray-500">
                  <span>Built on {FIT_PASSPORT.created}</span>
                  <span>•</span>
                  <span className="text-white">{FIT_PASSPORT.confidence} Confidence</span>
                  <span>•</span>
                  <span>Unique to you</span>
                </div>
                <div className="w-full max-w-2xl border-b border-white/10 mt-8" />
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                
                {/* LEFT COLUMN: INTERACTIVE BODY MAP & PASSPORT */}
                <div className="lg:col-span-5 flex flex-col gap-12">
                  
                  {/* FIT PASSPORT */}
                  <PremiumCard enableTilt>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.8 }}
                      className="relative w-full aspect-[1.6/1] perspective-1000 cursor-pointer group"
                      onClick={() => { setPassportFlipped(!passportFlipped); trackEvent('passport_flipped'); }}
                    >
                      <motion.div 
                        className="w-full h-full relative preserve-3d"
                        animate={{ rotateY: passportFlipped ? 180 : 0 }}
                        transition={{ duration: Motion.duration.slow, ease: Motion.ease.standard }}
                      >
                        {/* Front of Passport */}
                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#111] to-black rounded-3xl border border-white/10 p-6 flex flex-col justify-between overflow-hidden">
                          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00FFCC] rounded-full blur-[100px] opacity-10" />
                          
                          <div className="flex justify-between items-start relative z-10">
                            <div className="text-xs font-mono tracking-widest text-[#00FFCC] uppercase">Fit Passport</div>
                            <Scan className="w-5 h-5 text-gray-500" />
                          </div>
                          
                          <div className="relative z-10">
                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">ID / {FIT_PASSPORT.id}</div>
                            <div className="text-2xl font-bold tracking-tight mb-4">{FIT_PASSPORT.profile}</div>
                            
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Primary Size</div>
                                <div className="text-4xl font-black">{FIT_PASSPORT.primarySize}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Created</div>
                                <div className="text-sm font-medium">{FIT_PASSPORT.created}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Back of Passport */}
                        <div className="absolute inset-0 backface-hidden bg-white text-black rounded-3xl border border-white/20 p-6 flex flex-col justify-between" style={{ transform: 'rotateY(180deg)' }}>
                          <div className="text-xs font-mono tracking-widest text-gray-400 uppercase border-b border-gray-200 pb-2 mb-4">Official Fit Record</div>
                          <div className="flex-grow flex flex-col gap-3">
                            <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase">Chest</span><span className="font-mono text-sm">96cm</span></div>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase">Waist</span><span className="font-mono text-sm">82cm</span></div>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase">Shoulder</span><span className="font-mono text-sm">46cm</span></div>
                          </div>
                          <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center">
                            <div className="font-mono text-xs text-gray-400">Authenticated</div>
                            <ScanLine className="w-5 h-5 text-black" />
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </PremiumCard>

                  {/* INTERACTIVE BODY MAP */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#0A0A0A] rounded-3xl border border-white/5 p-8 relative flex flex-col items-center justify-center min-h-[500px]"
                  >
                    <div className="absolute top-6 left-6 text-xs font-mono uppercase tracking-widest text-gray-500">Interactive Map</div>
                    
                    <div className="relative w-48 h-96 flex flex-col items-center mt-8">
                      <div className="w-16 h-20 rounded-[40%] border border-white/10 mb-2" />
                      <div 
                        className={`w-36 h-40 rounded-t-3xl rounded-b-xl border transition-all duration-500 cursor-pointer ${hoveredPart === 'chest' ? 'border-[#00FFCC] shadow-[0_0_30px_rgba(0,255,204,0.3)] bg-[#00FFCC]/5' : 'border-white/10 hover:border-white/30'}`}
                        onMouseEnter={() => { setHoveredPart('chest'); trackEvent('body_part_interact', { part: 'chest' }); }}
                        onMouseLeave={() => setHoveredPart(null)}
                      />
                      <div 
                        className={`w-32 h-24 rounded-xl border -mt-2 transition-all duration-500 cursor-pointer ${hoveredPart === 'waist' ? 'border-[#00FFCC] shadow-[0_0_30px_rgba(0,255,204,0.3)] bg-[#00FFCC]/5' : 'border-white/10 hover:border-white/30'}`}
                        onMouseEnter={() => { setHoveredPart('waist'); trackEvent('body_part_interact', { part: 'waist' }); }}
                        onMouseLeave={() => setHoveredPart(null)}
                      />
                    </div>

                    <AnimatePresence>
                      {hoveredPart && (
                        <motion.div 
                          variants={scaleIn}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute bottom-8 w-full max-w-[280px] bg-black/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl z-10"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold uppercase tracking-widest">{hoveredPart === 'chest' ? 'Chest / Torso' : 'Waist / Hips'}</div>
                            <div className="text-[#00FFCC] font-mono">{hoveredPart === 'chest' ? '96 cm' : '82 cm'}</div>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {hoveredPart === 'chest' ? 'This measurement strongly influences shirt sizing and jacket drape.' : 'Crucial for trouser fit. Sits perfectly at the transition of modern M sizes.'}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono uppercase text-[#00FFCC]">
                            <div className="w-1 h-1 rounded-full bg-[#00FFCC]" />
                            98% Confidence
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* RIGHT COLUMN: INTELLIGENCE STORY */}
                <div className="lg:col-span-7 space-y-12">
                  
                  {/* FIT DNA */}
                  <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-sm font-mono tracking-widest text-[#00FFCC] uppercase mb-6">Fit DNA</h2>
                    <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(FIT_DNA).map(([key, value]) => (
                        <StaggerItem key={key}>
                          <PremiumCard className="bg-[#111] border border-white/5 p-5 rounded-2xl flex flex-col justify-between aspect-square">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div className="text-lg font-bold tracking-tight">{value}</div>
                          </PremiumCard>
                        </StaggerItem>
                      ))}
                    </Stagger>
                  </motion.section>

                  {/* MEASUREMENT STORY & BODY SIMILARITY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FadeUp>
                      <h2 className="text-sm font-mono tracking-widest text-gray-500 uppercase mb-6">The Analysis</h2>
                      <p className="text-gray-300 font-light leading-relaxed text-lg">
                        {MEASUREMENT_STORY}
                      </p>
                    </FadeUp>
                    <GlassReveal>
                      <div className="bg-white text-black p-8 rounded-3xl flex flex-col justify-between h-full">
                        <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Body Similarity</div>
                        <div className="text-gray-800 text-sm font-medium mb-2">Your proportions most closely resemble:</div>
                        <div className="text-3xl font-black tracking-tighter uppercase leading-none">Modern <br/> Athletic Fit</div>
                      </div>
                    </GlassReveal>
                  </div>

                  {/* SIZE REASONING & SPECTRUM */}
                  <FadeUp className="bg-[#0A0A0A] border border-white/5 p-8 md:p-10 rounded-3xl">
                    <div className="flex flex-col md:flex-row gap-12">
                      <div className="flex-1">
                        <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">Why Size M?</h2>
                        <Stagger className="space-y-4">
                          {SIZE_REASONING.map((reason, i) => (
                            <StaggerItem key={i}>
                              <div className="flex items-start gap-4">
                                <div className="w-5 h-5 rounded-full bg-[#00FFCC]/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-[#00FFCC]" />
                                </div>
                                <div className="font-light text-gray-300">{reason}</div>
                              </div>
                            </StaggerItem>
                          ))}
                        </Stagger>
                      </div>

                      <div className="flex-1 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-12">
                        <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-8">Fit Spectrum</div>
                        
                        <div className="relative w-full h-1 bg-white/10 rounded-full mb-4">
                          <div className="absolute inset-0 flex justify-between px-1">
                            {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                              <div key={size} className="relative h-full w-[1px] bg-white/20">
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-500">{size}</div>
                              </div>
                            ))}
                          </div>
                          <div className="absolute top-1/2 -translate-y-1/2 left-[60%] w-3 h-3 bg-[#00FFCC] rounded-full shadow-[0_0_15px_#00FFCC]" />
                        </div>

                        <p className="mt-10 text-xs text-gray-400 leading-relaxed">
                          You sit near the upper boundary of Medium. Loose-fit garments may feel more comfortable in Large.
                        </p>
                      </div>
                    </div>
                  </FadeUp>

                  {/* STYLE FOUNDATION & CONFIDENCE TIMELINE */}
                  <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    <div className="border border-white/5 rounded-3xl p-8 bg-[#050505]">
                      <h2 className="text-sm font-mono tracking-widest text-gray-500 uppercase mb-8">Style Foundation</h2>
                      <div className="space-y-6">
                        {STYLE_FOUNDATION.map((item, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <div className="font-medium tracking-wide">{item}</div>
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-[#00FFCC]/20 rounded-3xl p-8 bg-[#00FFCC]/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFCC] rounded-full blur-[80px] opacity-20" />
                      <h2 className="text-sm font-mono tracking-widest text-[#00FFCC] uppercase mb-8 relative z-10">AI Confidence Timeline</h2>
                      
                      <div className="space-y-4 relative z-10">
                        {CONFIDENCE_TIMELINE.map((step, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-12 text-[10px] font-mono text-[#00FFCC] text-right">{step.confidence}%</div>
                            <div className="flex-1 h-[1px] bg-white/10 relative">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${step.confidence}%` }}
                                transition={{ delay: 0.8 + (i * 0.1), duration: Motion.duration.slow, ease: Motion.ease.decelerate }}
                                className="absolute inset-y-0 left-0 bg-[#00FFCC]/50"
                              />
                            </div>
                            <div className="w-24 text-[10px] font-mono text-gray-400 uppercase tracking-widest">{step.stage}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.section>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
      
      {/* Footer Nav Space */}
      <div className="h-24"></div>
    </div>
  );
}
