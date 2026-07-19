// Shared Framer Motion presets for the Automation Wizard (spec §7). Durations
// and easings mirror the Halo v4 motion tokens (--dur-* / --ease-*). Every
// consumer must still gate animation behind `useReducedMotion()` and fall back
// to instant opacity swaps when it returns true (spec §7, §11).

import type { Transition, Variants } from "framer-motion";

// Halo motion tokens (seconds, for Framer's time base).
export const DUR = {
  fast: 0.1,
  base: 0.2,
  slow: 0.3,
  slower: 0.4,
} as const;

export const EASE = {
  standard: [0.4, 0, 0.2, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
} as const;

// Step body cross-fade + horizontal slide (spec §7.1). `dir` = +1 forward, -1
// back. Enter decelerates in from +16px; exit accelerates out — distinct
// easings are baked into the variants so AnimatePresence honours both phases.
export const stepVariants: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 16 : -16, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: DUR.slow, ease: EASE.decelerate },
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -16 : 16,
    opacity: 0,
    transition: { duration: DUR.base, ease: EASE.accelerate },
  }),
};

// Card grid stagger (spec §7.3): fade + rise 8px, 40ms stagger, cap ~280ms.
export const cardContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const cardItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE.decelerate },
  },
};

// Chip in/out (spec §7.6): scale from 0.8 + fade.
export const chipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR.fast, ease: EASE.decelerate },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: DUR.fast, ease: EASE.accelerate },
  },
};

// Node pop when a step activates (spec §7.2).
export const nodePop: Transition = {
  duration: DUR.base,
  ease: EASE.standard,
};
