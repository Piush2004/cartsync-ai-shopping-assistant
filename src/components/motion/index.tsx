/**
 * CartSync AI — Reusable Motion Components
 * 
 * Drop-in components that wrap framer-motion with the Motion Design System tokens.
 * Every page uses these instead of raw <motion.div> with hardcoded values.
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate, useReducedMotion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Motion,
  fadeIn, fadeUp, fadeDown,
  slideLeft, slideRight,
  scaleIn, blurReveal, glassReveal,
  heroReveal, textReveal, imageReveal,
  cardLift, cardPress,
  staggerContainer, staggerContainerFast, staggerItem,
  numberCounterTransition,
} from '@/lib/motion';


// ─── CONTEXT: Reduced Motion ──────────────────────────────────────────────────

function useMotionSafe() {
  const prefersReduced = useReducedMotion();
  return !prefersReduced;
}


// ─── REVEAL WRAPPERS ──────────────────────────────────────────────────────────

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

function makeReveal(
  variants: Variants, 
  displayName: string
) {
  const Component = ({ children, className, delay = 0, once = true }: RevealProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount: 0.2, margin: '-60px' });
    const safe = useMotionSafe();

    if (!safe) {
      return <div ref={ref} className={className}>{children}</div>;
    }

    return (
      <motion.div
        ref={ref}
        className={className}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        style={{ willChange: 'opacity, transform' }}
        transition={{ delay }}
      >
        {children}
      </motion.div>
    );
  };

  Component.displayName = displayName;
  return Component;
}

export const FadeIn      = makeReveal(fadeIn,      'FadeIn');
export const FadeUp      = makeReveal(fadeUp,      'FadeUp');
export const FadeDown    = makeReveal(fadeDown,     'FadeDown');
export const SlideLeft   = makeReveal(slideLeft,   'SlideLeft');
export const SlideRight  = makeReveal(slideRight,  'SlideRight');
export const ScaleIn     = makeReveal(scaleIn,     'ScaleIn');
export const BlurReveal  = makeReveal(blurReveal,  'BlurReveal');
export const GlassReveal = makeReveal(glassReveal, 'GlassReveal');
export const ImageReveal = makeReveal(imageReveal, 'ImageReveal');


// ─── HERO TEXT REVEAL ─────────────────────────────────────────────────────────

export function HeroReveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const safe = useMotionSafe();

  if (!safe) return <div ref={ref} className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={heroReveal}
      style={{ willChange: 'opacity, transform, filter, letter-spacing' }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}


// ─── TEXT REVEAL ──────────────────────────────────────────────────────────────

export function TextReveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const safe = useMotionSafe();

  if (!safe) return <div ref={ref} className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={textReveal}
      style={{ willChange: 'opacity, transform, filter' }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}


// ─── STAGGER ──────────────────────────────────────────────────────────────────

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  fast?: boolean;
}

export function Stagger({ children, className, fast = false }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const safe = useMotionSafe();

  if (!safe) return <div ref={ref} className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fast ? staggerContainerFast : staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const safe = useMotionSafe();
  if (!safe) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={staggerItem} style={{ willChange: 'opacity, transform' }}>
      {children}
    </motion.div>
  );
}


// ─── PREMIUM CARD ─────────────────────────────────────────────────────────────

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  enableTilt?: boolean;
  glowColor?: string;
}

export function PremiumCard({ children, className = '', onClick, enableTilt = false, glowColor = 'rgba(0,255,204,0.08)' }: PremiumCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const safe = useMotionSafe();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !ref.current || !safe) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(${Motion.card.lift}px)`;
  }, [enableTilt, safe]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0px)';
  }, []);

  if (!safe) {
    return <div ref={ref} className={className} onClick={onClick}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={`transition-shadow duration-300 ${className}`}
      whileHover={!enableTilt ? cardLift : undefined}
      whileTap={cardPress}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: 'transform, box-shadow', transition: `transform ${Motion.duration.normal}s cubic-bezier(${[...Motion.ease.standard].join(',')})` }}
    >
      {children}
    </motion.div>
  );
}


// ─── NUMBER COUNTER ───────────────────────────────────────────────────────────

interface CounterProps {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}

export function NumberCounter({ from = 0, to, suffix = '', prefix = '', className = '', decimals = 0 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const safe = useMotionSafe();
  const [displayed, setDisplayed] = useState(from);

  useEffect(() => {
    if (!isInView) return;
    if (!safe) { setDisplayed(to); return; }

    const controls = animate(from, to, {
      duration: numberCounterTransition.duration,
      ease: [...numberCounterTransition.ease],
      onUpdate: (v) => setDisplayed(v),
    });

    return () => controls.stop();
  }, [isInView, from, to, safe]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayed.toFixed(decimals)}{suffix}
    </span>
  );
}


// ─── CURSOR REACTIVE LIGHT ────────────────────────────────────────────────────

export function CursorLight({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const safe = useMotionSafe();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
  }, []);

  useEffect(() => {
    if (!safe || isMobile) return;
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      el.style.setProperty('--cursor-x', `${e.clientX}px`);
      el.style.setProperty('--cursor-y', `${e.clientY}px`);
      el.style.opacity = '1';
    };

    const handleLeave = () => {
      el.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [safe, isMobile]);

  if (!safe || isMobile) return null;

  return (
    <div
      ref={ref}
      className={`pointer-events-none fixed inset-0 z-[9999] opacity-0 transition-opacity duration-500 ${className}`}
      style={{
        background: 'radial-gradient(300px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(0,255,204,0.04), transparent 70%)',
      }}
    />
  );
}


// ─── GLASS SKELETON ───────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  lines?: number;
  circle?: boolean;
}

export function GlassSkeleton({ className = '', lines = 3, circle = false }: SkeletonProps) {
  if (circle) {
    return (
      <div className={`rounded-full bg-white/5 animate-pulse ${className}`} 
        style={{ animationDuration: '2s' }} />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-white/5 animate-pulse"
          style={{ 
            width: `${85 - i * 15}%`, 
            animationDelay: `${i * 0.15}s`,
            animationDuration: '2s',
          }}
        />
      ))}
    </div>
  );
}


// ─── PAGE TRANSITION WRAPPER ──────────────────────────────────────────────────

export function PageTransition({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const safe = useMotionSafe();

  if (!safe) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: Motion.distance.large }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -Motion.distance.small }}
      transition={{ duration: Motion.duration.slow, ease: Motion.ease.emphasized }}
    >
      {children}
    </motion.div>
  );
}


// ─── BUTTON ───────────────────────────────────────────────────────────────────

interface MotionButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
}

export function MotionButton({ children, className = '', onClick, variant = 'primary' }: MotionButtonProps) {
  const safe = useMotionSafe();
  const base = variant === 'primary'
    ? 'bg-white text-black hover:bg-[#00FFCC] hover:shadow-[0_0_24px_rgba(0,255,204,0.2)]'
    : 'bg-transparent text-white border border-white/20 hover:border-white/40';

  if (!safe) {
    return <button className={`${base} ${className}`} onClick={onClick}>{children}</button>;
  }

  return (
    <motion.button
      className={`transition-colors duration-300 ${base} ${className}`}
      whileHover={{ scale: Motion.card.hoverScale, y: -2 }}
      whileTap={{ scale: Motion.card.pressScale }}
      onClick={onClick}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.button>
  );
}
