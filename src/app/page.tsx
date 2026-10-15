'use client';
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ScanLine, Sparkles, Ruler, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { CursorLight, FadeUp, HeroReveal, TextReveal, Stagger, StaggerItem, PremiumCard, MotionButton, NumberCounter, PageTransition, ScaleIn } from '@/components/motion';
import { Motion, fadeDown, fadeUp, heroReveal, staggerContainer, staggerItem, cardLift, cardPress } from '@/lib/motion';

export default function Home() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] overflow-hidden selection:bg-[#00FFCC] selection:text-black font-sans">
      <CursorLight />
      
      {/* Dynamic Background Noise & Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#00FFCC] blur-[150px] mix-blend-screen opacity-20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#7000FF] blur-[150px] mix-blend-screen opacity-20" />
      </div>

      <nav className="fixed top-0 w-full z-50 flex justify-between items-center p-6 lg:px-12 backdrop-blur-md border-b border-white/5 bg-[#050505]/50">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeDown}
          transition={{ duration: Motion.duration.slow, ease: Motion.ease.emphasized }}
          className="text-xl font-bold tracking-tighter flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          CartSync <span className="text-[#00FFCC]">AI</span>
        </motion.div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeDown}
          transition={{ duration: Motion.duration.slow, ease: Motion.ease.emphasized, delay: 0.1 }}
          className="flex items-center gap-6"
        >
          <Link href="/login" className="text-sm font-medium tracking-widest uppercase text-gray-400 hover:text-white transition-colors hidden sm:block">
            Login
          </Link>
          <Link href="/scan" className="text-sm font-bold tracking-widest uppercase bg-white text-black px-6 py-3 rounded-full hover:bg-[#00FFCC] transition-colors">
            Get Scanned
          </Link>
        </motion.div>
      </nav>

      <main ref={targetRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-0 max-w-7xl mx-auto overflow-hidden">
        
        {/* Cinematic Sequence */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 1, 0], scale: [0.9, 1, 1.05] }}
            transition={{ duration: 4, times: [0, 0.4, 1], ease: "easeInOut" }}
            className="w-[400px] h-[600px] relative"
          >
            {/* Simulating a wireframe connecting */}
            <svg viewBox="0 0 100 200" className="w-full h-full opacity-50 drop-shadow-[0_0_15px_rgba(0,255,204,0.5)]">
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: Motion.duration.cinematic, ease: Motion.ease.decelerate }}
                d="M50 10 L65 25 L50 40 L35 25 Z" fill="none" stroke="#00FFCC" strokeWidth="0.5"
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: Motion.duration.cinematic, ease: Motion.ease.decelerate, delay: 0.5 }}
                d="M35 45 L65 45 L80 90 L65 190 L55 190 L50 120 L45 190 L35 190 L20 90 Z" fill="none" stroke="#7000FF" strokeWidth="0.5"
              />
              {/* Connecting points */}
              {[
                { cx: 50, cy: 10 },
                { cx: 65, cy: 25 },
                { cx: 50, cy: 40 },
                { cx: 35, cy: 25 },
                { cx: 80, cy: 90 },
                { cx: 65, cy: 190 },
                { cx: 55, cy: 190 },
                { cx: 50, cy: 120 },
                { cx: 45, cy: 190 },
                { cx: 20, cy: 90 }
              ].map((point, i) => (
                <motion.circle 
                  key={i}
                  initial={{ opacity: 0, r: 0 }}
                  animate={{ opacity: [0, 1, 0], r: [0, 2, 0] }}
                  transition={{ duration: Motion.duration.cinematic, delay: 1 + (i * 0.2), ease: Motion.ease.decelerate }}
                  cx={point.cx} cy={point.cy} fill="#FFF"
                />
              ))}
            </svg>
          </motion.div>
        </div>

        {/* Headline (Appears after wireframe sequence) */}
        <motion.div 
          style={{ y: yBg, opacity }} 
          className="flex flex-col items-center text-center w-full z-10"
        >
          <HeroReveal delay={4.5} className="text-4xl md:text-6xl lg:text-[7rem] font-black tracking-tighter leading-[0.9] text-white max-w-5xl">
            <h1>
              YOUR BODY DESERVES <br className="hidden md:block"/> 
              <span className="text-gray-600">BETTER THAN</span>
              <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFCC] to-[#7000FF]">SMALL, MEDIUM & LARGE.</span>
            </h1>
          </HeroReveal>

          <TextReveal delay={5.5} className="mt-8 text-lg md:text-2xl text-gray-400 font-light max-w-2xl tracking-wide leading-relaxed">
            <p>AI-powered fit intelligence for modern shopping.</p>
          </TextReveal>
          
          <FadeUp delay={6.5} className="mt-12 flex flex-col sm:flex-row items-center gap-6">
            <div>
              <motion.div whileHover={cardLift} whileTap={cardPress}>
                <Link href="/scan" className="group relative inline-flex items-center justify-center px-12 py-6 bg-white text-black font-black uppercase tracking-widest rounded-full overflow-hidden transition-transform active:scale-95 w-full sm:w-auto shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(0,255,204,0.3)]">
                  <span className="relative z-10 flex items-center gap-3">
                    <ScanLine className="w-5 h-5" />
                    Start Your Scan
                  </span>
                  <div className="absolute inset-0 h-full w-full bg-[#00FFCC] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out" />
                </Link>
              </motion.div>
            </div>
          </FadeUp>
        </motion.div>
      </main>

      {/* Storytelling Section */}
      <section className="relative z-10 py-32 px-4 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <FadeUp className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-tight mb-8">
            <h2>
              REDEFINING THE <span className="text-gray-600">ANATOMY</span> <br/> OF FASHION.
            </h2>
          </FadeUp>
          <TextReveal delay={0.2} className="text-gray-400 text-lg md:text-xl font-light tracking-wide max-w-2xl">
            <p>
              We believe that sizing is fundamentally broken. Mass production forced humanity into three arbitrary buckets. CartSync AI uses millimeter-accurate computer vision to restore the luxury of tailored fit to everyday shopping.
            </p>
          </TextReveal>
        </div>
      </section>

      {/* How it Works - Minimal Grid */}
      <section className="relative z-10 py-32 px-4 max-w-7xl mx-auto">
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <StaggerItem>
            <PremiumCard className="group flex flex-col border border-white/10 rounded-2xl p-10 hover:border-[#00FFCC]/50 transition-colors bg-[#0A0A0A] h-full">
              <div className="text-[#00FFCC] font-mono text-sm tracking-widest mb-16">01 // THE SETUP</div>
              <h3 className="text-2xl font-bold tracking-tight mb-4">Preparation</h3>
              <p className="text-gray-500 font-light leading-relaxed">
                Wear form-fitting clothing. Stand in a well-lit room. Our AI guide ensures your camera angle and distance are mathematically perfect before you even begin.
              </p>
            </PremiumCard>
          </StaggerItem>

          {/* Step 2 */}
          <StaggerItem>
            <PremiumCard className="group flex flex-col border border-white/10 rounded-2xl p-10 hover:border-[#00FFCC]/50 transition-colors bg-[#0A0A0A] h-full">
              <div className="text-[#00FFCC] font-mono text-sm tracking-widest mb-16">02 // THE CAPTURE</div>
              <h3 className="text-2xl font-bold tracking-tight mb-4">Dual-Image Scan</h3>
              <p className="text-gray-500 font-light leading-relaxed">
                One front profile. One side profile. Processing happens entirely on-device for maximum privacy. No video required. No awkward spinning.
              </p>
            </PremiumCard>
          </StaggerItem>

          {/* Step 3 */}
          <StaggerItem>
            <PremiumCard className="group flex flex-col border border-white/10 rounded-2xl p-10 hover:border-[#00FFCC]/50 transition-colors bg-[#0A0A0A] h-full">
              <div className="text-[#00FFCC] font-mono text-sm tracking-widest mb-16">03 // THE RESULT</div>
              <h3 className="text-2xl font-bold tracking-tight mb-4">3D Body Map</h3>
              <p className="text-gray-500 font-light leading-relaxed">
                33 biometric landmarks are extracted to generate your unique Fit DNA. We cross-reference this against proprietary brand sizing charts instantly.
              </p>
            </PremiumCard>
          </StaggerItem>

        </Stagger>
      </section>

      {/* Editorial Brands Section */}
      <section className="py-32 border-y border-white/5 bg-[#030303] flex flex-col items-center">
        <p className="text-xs font-mono tracking-[0.3em] text-gray-600 uppercase mb-16">Intelligence For Premium Labels</p>
        <div className="flex flex-wrap justify-center gap-16 md:gap-32 items-center px-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          <span className="font-black tracking-widest text-3xl md:text-4xl uppercase text-white">Arc'teryx</span>
          <span className="font-serif italic tracking-widest text-3xl md:text-4xl text-white">COS</span>
          <span className="font-black tracking-tighter text-4xl md:text-5xl uppercase text-white">NIKE</span>
          <span className="font-bold tracking-[0.2em] text-2xl md:text-3xl uppercase text-white">ZARA</span>
          <span className="font-sans font-bold tracking-tight text-3xl md:text-4xl text-white">ALO</span>
        </div>
      </section>

      {/* Testimonials / Confidence Proofs */}
      <section className="relative z-10 py-32 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight mb-8">
                ENGINEERED FOR <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFCC] to-[#7000FF]">CONFIDENCE.</span>
              </h2>
              <p className="text-gray-400 text-lg font-light leading-relaxed mb-8">
                "The fit receipts changed how I shop. I don't just see a size recommendation; I see exactly how the garment will drape across my shoulders and waist. It's like having a tailor in my pocket."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden">
                  <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User" width={48} height={48} className="object-cover" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-widest uppercase">Elena V.</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">Fit Confidence: 98%</div>
                </div>
              </div>
            </div>
          </FadeUp>
          
          <ScaleIn className="relative h-[400px] w-full rounded-2xl border border-white/10 overflow-hidden bg-[#0A0A0A] flex items-center justify-center group">
            <div>
              {/* Abstract UI representation of confidence */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.1),transparent_50%)]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-48 h-48 rounded-full border border-[#00FFCC]/30 flex items-center justify-center relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t border-[#00FFCC]"
                  />
                  <div className="text-5xl font-light tracking-tighter">
                    <NumberCounter from={0} to={98} suffix="%" />
                  </div>
                </div>
                <div className="mt-6 text-sm font-mono tracking-widest text-[#00FFCC] uppercase">Match Precision</div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#030303]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00FFCC]" />
            CartSync <span className="text-gray-600">AI</span>
          </div>
          <div className="flex gap-8 text-sm font-mono tracking-widest uppercase text-gray-500">
            <Link href="/scan" className="hover:text-white transition-colors">Scan</Link>
            <Link href="/discover" className="hover:text-white transition-colors">Discover</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
          <div className="text-xs font-mono text-gray-700">
            v2.0 Beta — The Future of Fit.
          </div>
        </div>
      </footer>
    </div>
  );
}
