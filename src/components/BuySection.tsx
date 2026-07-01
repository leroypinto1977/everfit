"use client";

import Link from "next/link";
import { motion } from "motion/react";
import Magnetic from "./Magnetic";
import Reveal from "./Reveal";
import { InfinityMark } from "./Logo";

/** Brand-level closer: "Be the woman" + the two paths into EVHERFIT. */
export default function BuySection() {
  return (
    <section className="relative overflow-hidden bg-brand">
      <div className="pointer-events-none absolute -right-40 bottom-0 hidden w-[640px] text-white opacity-[0.07] sm:block">
        <InfinityMark className="w-full" />
      </div>
      <div className="absolute left-1/2 top-0 h-[400px] w-[700px] max-w-full -translate-x-1/2 rounded-full bg-white/10 blur-[160px]" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.21, 0.65, 0.36, 1] }}
          className="w-48 text-white sm:w-60"
        >
          <InfinityMark className="w-full" draw />
        </motion.div>

        <Reveal delay={0.15}>
          <h2 className="mt-10 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            <span className="text-shine">Be the woman.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-6 max-w-xl text-lg text-white/75">
            Lifelong strength starts with one step. Join a live program, train
            one-to-one with Manjula, or pick up the gear that goes everywhere you do.
          </p>
        </Reveal>

        <Reveal delay={0.45}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Magnetic strength={0.5}>
              <a
                href="#programs"
                className="inline-block rounded-full bg-accent px-10 py-5 font-display text-lg font-bold text-white transition hover:brightness-95"
              >
                Explore programs →
              </a>
            </Magnetic>
            <Link
              href="/product"
              className="inline-block rounded-full border border-white/30 px-10 py-5 font-display text-lg font-bold text-white transition hover:bg-white/10"
            >
              Shop the band
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.6}>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">
            Trusted by 20,000+ women · Tamil Nadu&apos;s women&apos;s fitness coach
          </p>
        </Reveal>
      </div>
    </section>
  );
}
