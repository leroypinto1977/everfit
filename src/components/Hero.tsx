"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import BandVisual from "./BandVisual";
import SplitText from "./SplitText";
import Magnetic from "./Magnetic";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // parallax: band drifts up slower than the page, text fades out
  const bandY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const bandScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden pt-24">
      {/* ambient glows */}
      <div className="animate-breathe absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-accent/10 blur-[140px]" />
      <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[120px]" />

      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.2fr_1fr]">
        <motion.div style={{ opacity: textOpacity, y: textY }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            New · Pulse Gen 2
          </motion.p>

          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">
            <SplitText text="Built for" delay={0.3} />
            <br />
            <SplitText text="every rep." delay={0.55} className="text-accent" />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="mt-7 max-w-md text-lg leading-relaxed text-muted"
          >
            Heart rate, sleep, SpO2 and 110+ workout modes — tracked by a band
            that runs 14 days on one charge. No subscriptions. No excuses.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7 }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <Magnetic>
              <Link
                href="/checkout"
                className="rounded-full bg-accent px-8 py-4 font-display text-base font-bold text-background transition-transform hover:scale-105 active:scale-95"
              >
                Get yours — ₹2,999
              </Link>
            </Magnetic>
            <a href="#features" className="group text-sm text-muted transition-colors hover:text-foreground">
              Explore features
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>
          </motion.div>
        </motion.div>

        {/* band */}
        <motion.div
          style={{ y: bandY, scale: bandScale }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1, ease: [0.21, 0.65, 0.36, 1] }}
          className="relative mx-auto w-64 sm:w-72 lg:w-80"
        >
          <div className="animate-breathe absolute inset-0 -z-10 rounded-full bg-accent/15 blur-[80px]" />
          <div className="animate-float-slow">
            <BandVisual screen="heart" className="w-full drop-shadow-2xl" />
          </div>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        style={{ opacity: textOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="block"
        >
          Scroll ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
