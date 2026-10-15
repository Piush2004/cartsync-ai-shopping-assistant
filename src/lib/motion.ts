/**
 * CartSync AI — Motion Design System
 * 
 * Centralized motion tokens, easing curves, and animation presets.
 * Every animation in the product must reference these values.
 * No hardcoded durations, easings, or distances anywhere else.
 * 
 * Principles:
 *   1. Nothing suddenly appears.
 *   2. Never animate more than one major element aggressively.
 *   3. Animation communicates state, never decoration.
 */

// ─── TOKENS ────────────────────────────────────────────────────────────────────

export const Motion = {
  // Durations (seconds)
  duration: {
    instant:  0.1,
    fast:     0.18,
    normal:   0.32,
    slow:     0.55,
    slower:   0.8,
    cinematic: 1.2,
  },

  // Easing curves (cubic-bezier arrays for framer-motion)
  ease: {
    standard:    [0.25, 0.1, 0.25, 1.0],   // General-purpose
    emphasized:  [0.16, 1, 0.3, 1],         // Entrances, major reveals
    decelerate:  [0.0, 0.0, 0.2, 1.0],      // Entering elements
    accelerate:  [0.4, 0.0, 1.0, 1.0],      // Exiting elements
    spring:      { type: 'spring', stiffness: 300, damping: 30 },
    springGentle:{ type: 'spring', stiffness: 200, damping: 25 },
    springSnappy:{ type: 'spring', stiffness: 400, damping: 35 },
  },

  // Stagger delays (seconds)
  stagger: {
    fast:    0.04,
    normal:  0.08,
    slow:    0.12,
    relaxed: 0.18,
  },

  // Physical distances (pixels)
  distance: {
    micro:   4,
    small:   8,
    normal:  16,
    large:   24,
    hero:    40,
  },

  // Card interaction values
  card: {
    lift:        -8,    // translateY on hover
    shadowRest:  '0 1px 3px rgba(0,0,0,0.12)',
    shadowHover: '0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
    hoverScale:  1.02,
    pressScale:  0.98,
  },

  // Blur values
  blur: {
    none:   'blur(0px)',
    subtle: 'blur(4px)',
    medium: 'blur(8px)',
    heavy:  'blur(16px)',
    glass:  'blur(24px)',
  },

  // Viewport trigger
  viewport: {
    once:   true,
    amount: 0.2,
    margin: '-80px',
  },
} as const;


// ─── ANIMATION VARIANTS (Framer Motion) ────────────────────────────────────────

/** Fade in from transparent */
export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: Motion.duration.normal, ease: Motion.ease.standard } },
  exit:    { opacity: 0, transition: { duration: Motion.duration.fast, ease: Motion.ease.accelerate } },
};

/** Fade + slide up */
export const fadeUp = {
  hidden:  { opacity: 0, y: Motion.distance.normal },
  visible: { opacity: 1, y: 0, transition: { duration: Motion.duration.normal, ease: Motion.ease.emphasized } },
  exit:    { opacity: 0, y: -Motion.distance.small, transition: { duration: Motion.duration.fast, ease: Motion.ease.accelerate } },
};

/** Fade + slide down */
export const fadeDown = {
  hidden:  { opacity: 0, y: -Motion.distance.normal },
  visible: { opacity: 1, y: 0, transition: { duration: Motion.duration.normal, ease: Motion.ease.emphasized } },
  exit:    { opacity: 0, y: Motion.distance.small, transition: { duration: Motion.duration.fast } },
};

/** Slide from left */
export const slideLeft = {
  hidden:  { opacity: 0, x: -Motion.distance.large },
  visible: { opacity: 1, x: 0, transition: { duration: Motion.duration.normal, ease: Motion.ease.emphasized } },
  exit:    { opacity: 0, x: -Motion.distance.normal, transition: { duration: Motion.duration.fast } },
};

/** Slide from right */
export const slideRight = {
  hidden:  { opacity: 0, x: Motion.distance.large },
  visible: { opacity: 1, x: 0, transition: { duration: Motion.duration.normal, ease: Motion.ease.emphasized } },
  exit:    { opacity: 0, x: Motion.distance.normal, transition: { duration: Motion.duration.fast } },
};

/** Scale in from slightly smaller */
export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: Motion.duration.normal, ease: Motion.ease.emphasized } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: Motion.duration.fast } },
};

/** Blur → focus reveal */
export const blurReveal = {
  hidden:  { opacity: 0, filter: Motion.blur.medium },
  visible: { opacity: 1, filter: Motion.blur.none, transition: { duration: Motion.duration.slow, ease: Motion.ease.decelerate } },
  exit:    { opacity: 0, filter: Motion.blur.subtle, transition: { duration: Motion.duration.fast } },
};

/** Glass card entrance */
export const glassReveal = {
  hidden:  { opacity: 0, scale: 0.96, filter: Motion.blur.subtle, y: Motion.distance.small },
  visible: { 
    opacity: 1, scale: 1, filter: Motion.blur.none, y: 0,
    transition: { duration: Motion.duration.slow, ease: Motion.ease.emphasized } 
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: Motion.duration.fast } },
};

/** Hero headline reveal — blur + spacing tightens */
export const heroReveal = {
  hidden:  { opacity: 0, filter: Motion.blur.medium, letterSpacing: '0.1em', y: Motion.distance.normal },
  visible: { 
    opacity: 1, filter: Motion.blur.none, letterSpacing: '-0.04em', y: 0,
    transition: { duration: Motion.duration.cinematic, ease: Motion.ease.decelerate }
  },
};

/** Text reveal — subtle upward + slight blur clear */
export const textReveal = {
  hidden:  { opacity: 0, y: Motion.distance.small, filter: 'blur(2px)' },
  visible: { 
    opacity: 1, y: 0, filter: Motion.blur.none,
    transition: { duration: Motion.duration.normal, ease: Motion.ease.emphasized }
  },
};

/** Image reveal — scale + opacity */
export const imageReveal = {
  hidden:  { opacity: 0, scale: 1.06 },
  visible: { 
    opacity: 1, scale: 1,
    transition: { duration: Motion.duration.slower, ease: Motion.ease.decelerate }
  },
};

/** Card lift on hover (use in whileHover) */
export const cardLift = {
  y: Motion.card.lift,
  scale: Motion.card.hoverScale,
  boxShadow: Motion.card.shadowHover,
  transition: { duration: Motion.duration.normal, ease: Motion.ease.standard },
};

/** Card press (use in whileTap) */
export const cardPress = {
  scale: Motion.card.pressScale,
  transition: { duration: Motion.duration.instant },
};

/** Page enter */
export const pageReveal = {
  hidden:  { opacity: 0, y: Motion.distance.large },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: Motion.duration.slow, ease: Motion.ease.emphasized, staggerChildren: Motion.stagger.normal }
  },
  exit: { opacity: 0, y: -Motion.distance.small, transition: { duration: Motion.duration.normal, ease: Motion.ease.accelerate } },
};

/** Page exit */
export const pageExit = {
  exit: { opacity: 0, y: -Motion.distance.normal, transition: { duration: Motion.duration.normal, ease: Motion.ease.accelerate } },
};

/** Stagger container */
export const staggerContainer = {
  hidden:  { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: Motion.stagger.normal, delayChildren: 0.1 },
  },
};

/** Stagger container — fast variant */
export const staggerContainerFast = {
  hidden:  { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: Motion.stagger.fast, delayChildren: 0.05 },
  },
};

/** Stagger item (pairs with staggerContainer) */
export const staggerItem = {
  hidden:  { opacity: 0, y: Motion.distance.normal },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: Motion.duration.normal, ease: Motion.ease.emphasized }
  },
};

/** Number counter — used as a transition config, not a variant */
export const numberCounterTransition = {
  duration: Motion.duration.cinematic,
  ease: Motion.ease.decelerate,
};
