"use client";

import Reveal from "./Reveal";

const reviews = [
  {
    quote:
      "I wear the 0.5s on every morning walk now. Same route, same time — my watch says a third more burn and my arms finally feel worked.",
    name: "Ananya R.",
    tag: "Morning walker, Bengaluru",
  },
  {
    quote:
      "Wore ankle weights for years that bounced and bruised. These genuinely don't move — I forget they're on until the next day's soreness reminds me.",
    name: "Priya S.",
    tag: "Pilates, Mumbai",
  },
  {
    quote:
      "Threw them in the wash after a sweaty month of use. Came out like new. The pink stitching still makes me smile mid-burpee.",
    name: "Meera K.",
    tag: "HIIT, Pune",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-6 py-32">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Reviews</p>
        <h2 className="font-display text-4xl font-bold tracking-tight text-brand sm:text-6xl">
          Women who don&apos;t skip. <span className="text-foreground/60">Neither do these.</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.name} delay={i * 0.15}>
            <figure className="flex h-full flex-col justify-between rounded-3xl border border-line bg-card p-8 shadow-[0_2px_20px_rgba(43,51,125,0.05)] transition-colors duration-300 hover:border-brand/30">
              <div>
                <div className="mb-5 text-accent" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote className="text-lg leading-relaxed">&ldquo;{r.quote}&rdquo;</blockquote>
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
