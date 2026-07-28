"use client";

import { motion } from "motion/react";
import Reveal from "./Reveal";
import { InfinityMark } from "./Logo";

const stats = [
  { value: "7+", label: "Years coaching" },
  { value: "20,000+", label: "Women transformed" },
  { value: "2", label: "Flagship programs" },
];

/** "Meet Manjula" — the trust bridge into the programs. */
export default function Coach() {
  return (
    <section className="border-y border-line bg-brand-soft/40">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 sm:py-28 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        {/* signature quote — the portrait lives in the hero now */}
        <Reveal>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.21, 0.65, 0.36, 1] }}
            className="relative mx-auto flex aspect-[4/5] w-full max-w-sm flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-brand-deep p-8 shadow-[0_24px_70px_rgba(43,51,125,0.3)] sm:p-10"
          >
            <div className="pointer-events-none absolute -right-16 -top-10 w-64 text-white opacity-[0.08]">
              <InfinityMark className="w-full" />
            </div>
            <span className="font-display text-7xl font-bold leading-none text-accent-soft">&ldquo;</span>
            <blockquote className="relative font-display text-2xl font-bold leading-snug text-white sm:text-[1.7rem]">
              Strong aaga gym theva illa. Unga veetla oru corner and a strong promise to yourself is what you need.
            </blockquote>
            <div className="relative">
              <p className="font-display text-lg font-bold text-white">Manjula Narayanan</p>
              <p className="mt-1.5 text-xs uppercase tracking-[0.25em] text-white/70">Founder, EVHERFIT</p>
            </div>
          </motion.div>
        </Reveal>

        <div>
          <Reveal>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Meet your coach</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-brand sm:text-5xl">
              Manjula Narayanan
            </h2>
            <p className="mt-2 font-display text-lg text-foreground/70">
              Tamil Nadu&apos;s trusted women&apos;s fitness coach
            </p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Seven years. Twenty thousand women. One belief: that real, lasting
              fitness is built on sustainable habits, not crash diets or punishing
              gym hours. Every workout Manjula designs is meant to be done at
              home, because she coaches with a cultural understanding of everyday
              Indian households — where a woman&apos;s time is never fully her
              own, and thirty minutes has to count. Join her live Challenge or
              train personally through One-to-One coaching.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <div className="rounded-2xl border border-line bg-card px-2.5 py-6 text-center sm:px-4">
                  <p className="font-display text-xl font-bold text-brand sm:text-3xl lg:text-4xl">{s.value}</p>
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.15em]">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
