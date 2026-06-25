"use client";

import Link from "next/link";
import { motion } from "motion/react";
import Magnetic from "./Magnetic";
import ProductVisual from "./ProductVisual";
import Reveal from "./Reveal";
import { InfinityMark } from "./Logo";

/** Full-bleed indigo panel, in the style of the brand book's covers. */
export default function BuySection() {
  return (
    <section className="relative overflow-hidden bg-brand">
      <div className="pointer-events-none absolute -right-40 bottom-0 w-[640px] text-white opacity-[0.07]">
        <InfinityMark className="w-full" />
      </div>
      <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-white/10 blur-[160px]" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.21, 0.65, 0.36, 1] }}
          className="w-64 sm:w-72"
        >
          <ProductVisual view="pair" className="w-full" />
        </motion.div>

        <Reveal delay={0.15}>
          <h2 className="mt-10 font-display text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="text-shine">Be the woman.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-6 max-w-xl text-lg text-white/75">
            The EVHERFIT Infinity Band · pairs from{" "}
            <span className="font-display text-2xl font-bold text-white">₹1,499</span> · Free
            shipping across India · 7-day returns
          </p>
        </Reveal>

        <Reveal delay={0.45}>
          <div className="mt-10">
            <Magnetic strength={0.5}>
              <Link
                href="/checkout"
                className="inline-block rounded-full bg-accent px-12 py-5 font-display text-lg font-bold text-white transition hover:brightness-95"
              >
                Get yours →
              </Link>
            </Magnetic>
          </div>
        </Reveal>

        <Reveal delay={0.6}>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">
            Secure payment via Razorpay · UPI, cards, netbanking & EMI
          </p>
        </Reveal>
      </div>
    </section>
  );
}
