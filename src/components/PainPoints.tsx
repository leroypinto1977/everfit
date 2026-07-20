"use client";

import Reveal from "./Reveal";

const pains = [
  {
    title: "Everyone eats before you do",
    body: "You run the house, the job, the family calendar. You're the engine of it all, and your own fuel always comes last.",
  },
  {
    title: "Tired is your baseline",
    body: "A back that aches by evening, knees that complain on the stairs, energy that runs out before the day does.",
  },
  {
    title: "Your body has been through chapters",
    body: "Pregnancy, postpartum, PCOS, thyroid, menopause. Your body has carried a lot. It deserves care, not criticism.",
  },
  {
    title: "The gym never fit your life",
    body: "Too far, too expensive, too intimidating. Mirrors, machines and stares, and guilt the moment you miss a week.",
  },
  {
    title: "“I'll start on Monday”",
    body: "It has been Monday for years. Not because you're lazy, but because nothing was ever built around your schedule.",
  },
  {
    title: "Me-time feels selfish",
    body: "Thirty minutes for yourself feels like thirty minutes stolen from someone else. So you keep giving yours away.",
  },
];

/** Story chapter 1 — name the pain the reader lives with every day. */
export default function PainPoints() {
  return (
    <section id="we-see-you" className="relative mx-auto max-w-7xl px-6 py-20 sm:py-32">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">We see you</p>
        <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-brand sm:text-6xl">
          Your day has no slot
          <br />
          <span className="text-foreground/60">that says &ldquo;me&rdquo;.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          For most Indian women, health isn&apos;t neglected because it doesn&apos;t
          matter. It&apos;s neglected because everything else is allowed to matter
          more. Does any of this sound like your day?
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pains.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <div className="h-full rounded-3xl border border-line bg-card p-7 shadow-[0_2px_20px_rgba(43,51,125,0.05)] transition-colors duration-300 hover:border-brand/30">
              <span className="font-display text-sm font-bold text-accent">0{i + 1}</span>
              <h3 className="mt-3 font-display text-xl font-bold leading-snug text-brand">{p.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <p className="mx-auto mt-14 max-w-2xl text-center font-display text-xl font-bold leading-relaxed text-foreground sm:text-2xl">
          None of this means you&apos;ve failed.
          <br />
          <span className="text-brand">
            It means fitness was never designed around your life. So let&apos;s redesign it.
          </span>
        </p>
      </Reveal>
    </section>
  );
}
