"use client";

import Link from "next/link";
import { motion } from "motion/react";
import Magnetic from "./Magnetic";
import BandVisual from "./BandVisual";
import Reveal from "./Reveal";

export default function BuySection() {
  return (
    <section className="relative overflow-hidden border-t border-line">
      <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-brand-bright/15 blur-[160px]" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.21, 0.65, 0.36, 1] }}
          className="w-40 sm:w-48"
        >
          <BandVisual screen="cycle" className="w-full drop-shadow-2xl" />
        </motion.div>

        <Reveal delay={0.15}>
          <h2 className="mt-12 font-display text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="text-shine">Be the woman.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-6 max-w-xl text-lg text-muted">
            EVHERFIT Pulse · <span className="text-foreground line-through opacity-50">₹4,999</span>{" "}
            <span className="font-display text-2xl font-bold text-foreground">₹2,999</span> · Free
            shipping across India · 7-day returns
          </p>
        </Reveal>

        <Reveal delay={0.45}>
          <div className="mt-10">
            <Magnetic strength={0.5}>
              <Link
                href="/checkout"
                className="inline-block rounded-full bg-accent px-12 py-5 font-display text-lg font-bold text-background transition-transform hover:scale-105 active:scale-95"
              >
                Buy now →
              </Link>
            </Magnetic>
          </div>
        </Reveal>

        <Reveal delay={0.6}>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted">
            Secure payment via Razorpay · UPI, cards, netbanking & EMI
          </p>
        </Reveal>
      </div>
    </section>
  );
}
