"use client";

import Reveal from "./Reveal";
import Magnetic from "./Magnetic";
import { InfinityMark } from "@everfit/core/components/Logo";

const truths = [
  "No commute, no memberships, no waiting for machines",
  "A band, a mat and a doorway are enough",
  "Your clothes, your music, your pace",
  "Before the house wakes up, or after it winds down",
  "Your kids get to watch their mother choose herself",
];

/** Story chapter 2 — break the "fitness = gym" myth, home is the answer. */
export default function MythBreak() {
  return (
    <section className="relative overflow-hidden bg-brand text-white">
      {/* watermark */}
      <div className="pointer-events-none absolute -left-40 bottom-0 w-[620px] text-white opacity-[0.06]">
        <InfinityMark className="w-full" />
      </div>
      <div className="absolute right-0 top-0 h-[360px] w-[520px] rounded-full bg-white/10 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32">
        <Reveal>
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent-soft">Break the myth</p>
          <h2 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            You don&apos;t need a gym.
            <br />
            <span className="text-white/60">You need thirty honest minutes.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* the myth */}
          <Reveal>
            <div className="h-full rounded-[2rem] border border-white/15 bg-white/5 p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">The myth</p>
              <p className="mt-5 font-display text-2xl font-bold leading-snug text-white/80">
                &ldquo;Real fitness needs a gym membership, heavy machines, two-hour
                sessions and a trainer counting your reps.&rdquo;
              </p>
              <p className="mt-5 leading-relaxed text-white/60">
                That version of fitness was never built for a woman whose day
                already belongs to everyone else. So it keeps failing her, and
                she keeps blaming herself.
              </p>
            </div>
          </Reveal>

          {/* the truth */}
          <Reveal delay={0.14}>
            <div className="h-full rounded-[2rem] bg-white p-8 text-foreground shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-10">
              <p className="text-xs uppercase tracking-[0.25em] text-accent">The truth</p>
              <p className="mt-5 font-display text-2xl font-bold leading-snug text-brand">
                Strength is built in your living room, in the time you actually
                have.
              </p>
              <ul className="mt-6 space-y-3">
                {truths.map((t) => (
                  <li key={t} className="flex gap-3 leading-relaxed text-foreground/80">
                    <span className="text-accent">∞</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="mt-14 flex flex-col items-center gap-8 text-center">
            <p className="max-w-2xl text-lg leading-relaxed text-white/75">
              And it isn&apos;t a quick fix you finish and forget. Your health is
              a daily practice, like the meals you cook and the people you care
              for. Small, steady, and yours for life.
            </p>
            <Magnetic>
              <a
                href="#programs"
                className="rounded-full bg-accent px-8 py-4 font-display text-base font-bold text-white transition hover:brightness-95"
              >
                Show me how it works at home
              </a>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
