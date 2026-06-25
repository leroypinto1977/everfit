"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import ProductVisual from "./ProductVisual";
import SplitText from "./SplitText";
import Magnetic from "./Magnetic";
import { InfinityMark } from "./Logo";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // parallax: band drifts up slower than the page, text fades out
  const bandY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const bandScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const markX = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <section ref={ref} className="relative flex min-h-screen items-center overflow-hidden pt-24">
      {/* giant watermark infinity, drifts with scroll */}
      <motion.div style={{ x: markX }} className="pointer-events-none absolute -right-44 top-1/4 w-[760px] text-brand opacity-[0.06]">
        <InfinityMark className="w-full" draw />
      </motion.div>

      {/* soft brand glows */}
      <div className="animate-breathe absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-brand/10 blur-[140px]" />
      <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-accent/15 blur-[120px]" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.15fr_1fr]">
        <motion.div style={{ opacity: textOpacity, y: textY }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-brand"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            The Infinity Band · Be the woman
          </motion.p>

          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            <SplitText text="Designed for her." delay={0.3} className="text-brand" />
            <br />
            <SplitText text="Built for life." delay={0.62} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            className="mt-7 max-w-md text-lg leading-relaxed text-muted"
          >
            Weighted bands for your wrists and ankles — an iron-sand core in a
            soft silicone shell. Turn every walk, flow and lift into resistance
            training. Strong is infinite.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.7 }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <Magnetic>
              <Link
                href="/checkout"
                className="rounded-full bg-brand px-8 py-4 font-display text-base font-bold text-white transition hover:brightness-95"
              >
                Get the pair — from ₹1,499
              </Link>
            </Magnetic>
            <a href="#showcase" className="group text-sm text-muted transition-colors hover:text-brand">
              See the band
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>
          </motion.div>
        </motion.div>

        {/* product */}
        <motion.div
          style={{ y: bandY, scale: bandScale }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1, ease: [0.21, 0.65, 0.36, 1] }}
          className="relative mx-auto w-80 sm:w-96"
        >
          <div className="animate-breathe absolute inset-8 -z-10 rounded-full bg-brand/15 blur-[70px]" />
          <div className="animate-float-slow">
            <ProductVisual view="loop" className="w-full" />
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
