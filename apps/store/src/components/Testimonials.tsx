"use client";

import Reveal from "./Reveal";

const reviews = [
  {
    quote:
      "I keep the blue band by the door and do 15 minutes before work. Rows, presses, curls, and my arms finally feel worked without a single dumbbell.",
    name: "Ananya R.",
    tag: "Morning routine, Bengaluru",
  },
  {
    quote:
      "The foam handles are so comfy and clip on in seconds. I started on the 4.5 kg and just moved up to the 9 kg, and having both has kept me progressing.",
    name: "Priya S.",
    tag: "Pilates, Mumbai",
  },
  {
    quote:
      "They coil into my carry-on, so my routine travels with me. Full-body workout in a hotel room, no excuses. That's what sold me on the bundle.",
    name: "Meera K.",
    tag: "HIIT, Pune",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-6 py-20 sm:py-32">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Reviews</p>
        <h2 className="font-display text-4xl font-bold tracking-tight text-brand sm:text-6xl">
          Women who don&apos;t skip.
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.name} delay={i * 0.15}>
            <figure className="flex h-full flex-col justify-between rounded-3xl border border-line bg-card p-8 shadow-[0_2px_20px_rgba(43,51,125,0.05)] transition-colors duration-300 hover:border-brand/30">
              <div>
                <div className="mb-5 text-accent" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote className="text-base leading-relaxed sm:text-lg">&ldquo;{r.quote}&rdquo;</blockquote>
              </div>
              <figcaption className="mt-8">
                <p className="font-display font-bold text-brand">{r.name}</p>
                <p className="text-sm text-muted">{r.tag}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
