"use client";

import { motion } from "motion/react";
import Reveal from "./Reveal";
import { InfinityMark } from "./Logo";

const stats = [
  { value: "7+", label: "Years coaching" },
  { value: "20,000+", label: "Women transformed" },
  { value: "2", label: "Flagship programs" },
];

/**
 * "Meet Manjula" — the trust bridge into the programs.
 * The portrait is a branded placeholder frame for now: drop an <img> into
 * the marked block once a photo of Manjula is available.
 */
export default function Coach() {
  return (
    <section className="border-y border-line bg-brand-soft/40">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 sm:py-28 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        {/* portrait frame (placeholder) */}
        <Reveal>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.21, 0.65, 0.36, 1] }}
            className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-brand-deep shadow-[0_24px_70px_rgba(43,51,125,0.3)]"
          >
            {/* TODO: replace this branded placeholder with Manjula's photo:
                <Image src="/manjula.jpg" alt="Manjula Narayanan" fill className="object-cover" /> */}
            <div className="absolute inset-0 grid place-items-center">
              <InfinityMark className="w-2/3 text-white/10" draw />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-7">
              <p className="font-display text-5xl font-bold leading-none text-white/90">MN</p>
              <p className="mt-2 text-sm uppercase tracking-[0.25em] text-white/70">Manjula Narayanan</p>
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
              Seven years. Twenty thousand women. One belief — that real, lasting
              fitness is built on sustainable habits, not crash diets or punishing
              gym hours. Manjula guides women through both the live Challenge and
              personal One-to-One coaching, with cultural understanding of everyday
              Indian households at the centre of it all.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <div className="rounded-2xl border border-line bg-card px-4 py-6 text-center">
                  <p className="font-display text-2xl font-bold text-brand sm:text-3xl lg:text-4xl">{s.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.15em] text-muted">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
