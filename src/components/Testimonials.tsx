"use client";

import Reveal from "./Reveal";

const reviews = [
  {
    quote:
      "Battery claim is real — I charge it twice a month. The sleep score nudged me into an actual bedtime routine.",
    name: "Ananya R.",
    tag: "Marathon trainee, Bengaluru",
  },
  {
    quote:
      "Switched from a band 3× the price. Heart-rate zones during HIIT match my gym's chest strap almost exactly.",
    name: "Vikram S.",
    tag: "CrossFit, Mumbai",
  },
  {
    quote:
      "Wore it through a monsoon trek and daily swims. Still flawless. The display is gorgeous in sunlight.",
    name: "Meera K.",
    tag: "Trekker, Pune",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-6 py-32">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Reviews</p>
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Worn hard. <span className="text-muted">Rated harder.</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={r.name} delay={i * 0.15}>
            <figure className="flex h-full flex-col justify-between rounded-3xl border border-line bg-card p-8 transition-colors duration-300 hover:border-accent/40">
              <div>
                <div className="mb-5 text-accent" aria-label="5 out of 5 stars">★★★★★</div>
                <blockquote className="text-lg leading-relaxed">&ldquo;{r.quote}&rdquo;</blockquote>
              </div>
              <figcaption className="mt-8">
                <p className="font-display font-bold">{r.name}</p>
                <p className="text-sm text-muted">{r.tag}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
