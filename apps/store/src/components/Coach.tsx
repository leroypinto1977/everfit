"use client";

import { m } from "motion/react";
import Reveal from "./Reveal";
import Image from "next/image";

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
          <m.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease: [0.21, 0.65, 0.36, 1] }}
            className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] bg-gradient-to-br from-brand to-brand-deep shadow-[0_24px_70px_rgba(43,51,125,0.3)] lg:max-w-md"
          >
            {/* Dedicated clip layer: its own compositing context (translateZ)
                keeps the scaled portrait clipped to the rounded frame even
                after Framer strips the parent transform — Safari/iOS otherwise
                fails to clip a composited (scaled) child to a rounded parent. */}
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] [transform:translateZ(0)]">
              <Image
                src="/manjula2.jpg"
                alt="Manjula Narayanan, founder of EVHERFIT and women's fitness coach"
                fill
                // no `priority`: this sits well below the fold, and preloading it
                // competes with the hero image for a phone's first bytes.
                loading="lazy"
                sizes="(max-width: 640px) 90vw, 700px"
                className="object-cover object-[44.2%_50%] scale-[1]"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-gradient-to-t from-brand-deep/85 via-brand-deep/30 to-transparent p-7">
              <p className="font-display text-2xl font-bold leading-none text-white">Manjula Narayanan</p>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/75">
                Founder · Women&apos;s fitness coach
              </p>
            </div>
          </m.div>
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
