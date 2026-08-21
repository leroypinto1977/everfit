"use client";

import { LazyMotion, domAnimation } from "motion/react";

/**
 * Loads Motion's DOM animation features once, lazily, for the whole app.
 *
 * Importing `motion.div` pulls Motion's entire feature set into the initial
 * bundle from every component that uses it. The `m` component is the same API
 * with the features supplied by this provider instead, which keeps them out of
 * the critical path — the thing that actually hurts on a phone, where parsing
 * and executing that JavaScript costs seconds of main-thread time rather than
 * the milliseconds it costs on a laptop.
 *
 * `domAnimation` covers animations, variants and exit (AnimatePresence). The
 * site uses no drag or layout animations, which are the only things that would
 * need the larger `domMax` bundle — so if someone adds `drag` or `layout` later
 * they must switch this import, and `strict` below is what will tell them:
 * it makes any stray `motion.*` throw instead of silently pulling the full
 * bundle back in and quietly undoing this.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
