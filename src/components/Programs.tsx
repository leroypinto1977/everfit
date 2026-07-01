"use client";

import { motion } from "motion/react";
import Reveal from "./Reveal";
import { InfinityMark } from "./Logo";
import { PROGRAMS } from "@/lib/programs";

/**
 * The brand-hub centrepiece: two program teasers that link out to the
 * dedicated program sites. Intro only — depth lives on the other screens.
 */
export default function Programs() {
  return (
    <section id="programs" className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Coaching with Manjula</p>
        <h2 className="font-display text-4xl font-bold tracking-tight text-brand sm:text-6xl">
          Two ways to train.
          <br />
          <span className="text-foreground/60">One infinite goal.</span>
        </h2>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Whether you thrive in a live group or want a plan built only for you —
          there&apos;s a path here. Take a look, then step in.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        {PROGRAMS.map((p, i) => {
          const dark = p.tone === "brand";
          return (
            <Reveal key={p.key} delay={i * 0.14}>
              <motion.a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border p-6 sm:p-9 lg:p-11 ${
                  dark
                    ? "border-brand bg-brand text-white shadow-[0_24px_70px_rgba(43,51,125,0.35)]"
                    : "border-line bg-card shadow-[0_2px_24px_rgba(43,51,125,0.06)]"
                }`}
              >
                {/* watermark mark */}
                <div
                  className={`pointer-events-none absolute -right-16 -top-12 w-72 transition-transform duration-700 group-hover:scale-110 ${
                    dark ? "text-white opacity-[0.08]" : "text-brand opacity-[0.05]"
                  }`}
                >
                  <InfinityMark className="w-full" />
                </div>

                <span
                  className={`relative inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
                    dark ? "bg-white/15 text-white" : "bg-accent-soft text-accent"
                  }`}
                >
                  {p.badge}
                </span>

                <h3 className={`relative mt-7 font-display text-3xl font-bold tracking-tight ${dark ? "text-white" : "text-brand"}`}>
                  {p.name}
                </h3>
                <p className={`relative mt-3 text-lg font-medium ${dark ? "text-accent-soft" : "text-accent"}`}>
                  {p.tagline}
                </p>
                <p className={`relative mt-4 leading-relaxed ${dark ? "text-white/75" : "text-muted"}`}>
                  {p.desc}
                </p>

                <ul className="relative mt-7 space-y-2.5">
                  {p.points.map((pt) => (
                    <li
                      key={pt}
                      className={`flex gap-3 text-[0.95rem] leading-relaxed ${dark ? "text-white/85" : "text-foreground/80"}`}
                    >
                      <span className={dark ? "text-accent-soft" : "text-accent"}>∞</span>
                      {pt}
                    </li>
                  ))}
                </ul>

                <div className="relative mt-9 pt-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-display font-bold transition group-hover:gap-3.5 ${
                      dark ? "bg-white text-brand" : "bg-brand text-white"
                    }`}
                  >
                    {p.cta}
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                  <p className={`mt-3 text-xs uppercase tracking-[0.18em] ${dark ? "text-white/45" : "text-muted/70"}`}>
                    Opens {new URL(p.href).host}
                  </p>
                </div>
              </motion.a>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
