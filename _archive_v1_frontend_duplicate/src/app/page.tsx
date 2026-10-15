'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  MessageSquare,
  Ruler,
  Camera,
  Search,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

/* ─────────────────────── Animated Orb ─────────────────────── */
function GradientOrb({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, delay, ease: 'easeOut' }}
      className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`}
    />
  );
}

/* ─────────────────────── Feature Card ─────────────────────── */
const features = [
  {
    icon: MessageSquare,
    title: 'AI Style Chat',
    description:
      'Converse naturally with our AI stylist. Describe your vibe, occasion, or mood — get curated outfit suggestions instantly.',
    gradient: 'from-violet-500/20 to-indigo-500/20',
  },
  {
    icon: Ruler,
    title: 'Smart Sizing',
    description:
      'Our body-profile engine analyses your measurements and brand sizing data to recommend your perfect fit every time.',
    gradient: 'from-indigo-500/20 to-cyan-500/20',
  },
  {
    icon: Camera,
    title: 'Virtual Try-On',
    description:
      'See how clothes look on you before purchasing. Upload a photo and try on any product from our catalogue.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: Search,
    title: 'Cross-Platform Search',
    description:
      'Search across multiple retailers simultaneously. Compare prices, reviews, and availability in one unified view.',
    gradient: 'from-fuchsia-500/20 to-violet-500/20',
  },
];

/* ─────────────────────── Steps Data ─────────────────────── */
const steps = [
  {
    number: '01',
    title: 'Create Your Profile',
    description:
      'Sign up in seconds and tell our AI about your style preferences, body measurements, and budget.',
  },
  {
    number: '02',
    title: 'Chat With Your Stylist',
    description:
      'Describe what you need — a date-night outfit, office wear, or vacation wardrobe. Our AI does the rest.',
  },
  {
    number: '03',
    title: 'Try Before You Buy',
    description:
      'Use virtual try-on to visualise how each piece looks on you. Get size recommendations tailored to each brand.',
  },
  {
    number: '04',
    title: 'Shop With Confidence',
    description:
      'Purchase directly through verified retailers. Fewer returns, more style, zero guesswork.',
  },
];

/* ─────────────────────── Animated Section Wrapper ─────────────────────── */
function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════ LANDING PAGE ═══════════════════════ */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <main className="relative overflow-hidden">
      <Navbar />

      {/* ───── HERO SECTION ───── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-16"
      >
        {/* Background Orbs */}
        <GradientOrb
          className="w-[600px] h-[600px] bg-violet-600/30 -top-40 -left-40"
          delay={0}
        />
        <GradientOrb
          className="w-[500px] h-[500px] bg-indigo-600/20 top-1/3 right-0"
          delay={0.3}
        />
        <GradientOrb
          className="w-[400px] h-[400px] bg-purple-600/20 bottom-0 left-1/3"
          delay={0.6}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent-light/40"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent-light" />
            <span className="text-sm text-zinc-300 font-medium">
              Powered by Multi-Agent AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6"
          >
            Your AI-Powered{' '}
            <span className="gradient-text">Style Assistant</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Intelligent fashion recommendations, virtual try-on, and smart sizing
            — all orchestrated by a team of specialised AI agents working together.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth">
              <motion.button
                whileHover={{
                  scale: 1.04,
                  boxShadow: '0 0 40px rgba(124,58,237,0.4)',
                }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-base px-8 py-4 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>

            <a href="#how-it-works">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ghost text-base px-8 py-4"
              >
                See How It Works
              </motion.button>
            </a>
          </motion.div>

          {/* Floating fashion elements */}
          <div className="relative mt-16">
            {/* Left floating card */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 sm:left-8 top-0 glass rounded-2xl p-4 hidden sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">AI Styling</p>
                  <p className="text-xs text-zinc-500">Instant recommendations</p>
                </div>
              </div>
            </motion.div>

            {/* Right floating card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
              className="absolute -right-4 sm:right-8 top-4 glass rounded-2xl p-4 hidden sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Perfect Fit</p>
                  <p className="text-xs text-zinc-500">Size guarantee</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-zinc-600" />
        </motion.div>
      </motion.section>

      {/* ───── FEATURES SECTION ───── */}
      <section className="relative py-32 px-4 sm:px-6">
        <GradientOrb
          className="w-[500px] h-[500px] bg-violet-600/10 top-0 right-1/4"
          delay={0}
        />

        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="text-sm font-semibold text-accent-light tracking-widest uppercase">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3 mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Shop Smarter</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Our multi-agent AI system combines styling expertise, body science,
              and computer vision to transform your shopping experience.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <AnimatedSection key={feature.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 8px 40px rgba(124,58,237,0.12)',
                    }}
                    className="glass rounded-2xl p-8 h-full group relative overflow-hidden"
                  >
                    {/* Gradient background on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />

                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-5 group-hover:animate-pulse-glow transition-all">
                        <Icon className="w-6 h-6 text-accent-light" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-zinc-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section id="how-it-works" className="relative py-32 px-4 sm:px-6">
        <GradientOrb
          className="w-[400px] h-[400px] bg-indigo-600/10 bottom-0 left-1/4"
          delay={0}
        />

        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-20">
            <span className="text-sm font-semibold text-accent-light tracking-widest uppercase">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3 mb-4">
              From Inspiration to{' '}
              <span className="gradient-text">Doorstep</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Four simple steps to a wardrobe you love.
            </p>
          </AnimatedSection>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <AnimatedSection key={step.number} delay={index * 0.12}>
                <motion.div
                  whileHover={{ x: 8 }}
                  className="glass rounded-2xl p-8 flex flex-col sm:flex-row items-start gap-6 group"
                >
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-accent/30 group-hover:animate-pulse-glow">
                    {step.number}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-zinc-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA SECTION ───── */}
      <section className="relative py-32 px-4 sm:px-6">
        <GradientOrb
          className="w-[600px] h-[600px] bg-violet-600/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          delay={0}
        />

        <AnimatedSection>
          <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 sm:p-16 relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10" />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-6"
              >
                <Sparkles className="w-10 h-10 text-accent-light" />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Ready to Transform Your{' '}
                <span className="gradient-text">Shopping?</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
                Join thousands of fashion-forward shoppers using AI to find their
                perfect style.
              </p>

              <Link href="/auth">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 0 50px rgba(124,58,237,0.5)',
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2"
                >
                  Start For Free
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>

              <p className="text-xs text-zinc-600 mt-4">
                30 free AI credits • No credit card required
              </p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-white/[0.06] py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-light" />
            <span className="font-bold gradient-text">CartSyncAI</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>

          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} CartSyncAI. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
