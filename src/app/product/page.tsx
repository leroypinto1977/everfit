import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import ProductBuyPanel from "@/components/ProductBuyPanel";
import Features from "@/components/Features";
import Showcase from "@/components/Showcase";
import Stats from "@/components/Stats";
import Pricing from "@/components/Pricing";
import Reveal from "@/components/Reveal";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "EVHERFIT Infinity Band — weighted resistance bands for her",
  description:
    "Iron-sand core, silicone shell, sold as a pair. Wearable weights for walks, yoga, pilates and strength — 0.5 kg to 2 kg per band.",
};

const highlights = [
  "Contoured for women's wrists & ankles — zero bounce",
  "Fine iron-sand fill spreads weight evenly, no pressure points",
  "Dual-lock: wide hook-and-loop strap through a steel D-ring",
  "Sweatproof silicone shell, fully machine washable",
];

const specs = [
  ["Weights available", "0.5 kg / 1 kg / 2 kg per band (sold as a pair)"],
  ["Shell", "Soft-touch, skin-safe silicone"],
  ["Fill", "Fine iron sand in 5 segmented pods"],
  ["Closure", "Hook-and-loop strap with steel D-ring"],
  ["Fits", "Wrist 13–20 cm · Ankle 19–28 cm"],
  ["Care", "Machine washable (30°C, gentle) — tested over 120 cycles"],
  ["Colourway", "Infinite Indigo with Palette W stitching"],
  ["Warranty", "1 year against manufacturing defects"],
];

const faqs = [
  {
    q: "Which weight should I start with?",
    a: "If weighted training is new to you, start with 0.5 kg for walks and mat work. The 1 kg pair is our most popular for yoga, power walks and HIIT. Pick 2 kg if you already train with resistance and want more.",
  },
  {
    q: "Wrist or ankle — where do I wear them?",
    a: "Both. The strap adjusts from a 13 cm wrist to a 28 cm ankle. Wrists turn arm movement into upper-body work; ankles add load to steps, kicks and leg raises.",
  },
  {
    q: "Can I wash them?",
    a: "Yes — the whole band goes in the machine at 30°C on gentle. The silicone shell and sealed pods are tested over 120 wash cycles with zero leaks.",
  },
  {
    q: "What if they don't fit or I change my mind?",
    a: "You have 7 days from delivery for a no-questions return, and a 1-year warranty against manufacturing defects. See our returns policy for details.",
  },
];

export default async function ProductPage() {
  const { variants } = await getCatalog();

  return (
    <main>
      <div className="mx-auto max-w-7xl px-6 pt-32">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            <Link href="/" className="transition-colors hover:text-brand">Home</Link> ·{" "}
            <span className="text-brand">The Infinity Band</span>
          </p>
        </Reveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <Reveal>
            <ProductGallery />
          </Reveal>

          <Reveal delay={0.15}>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Be the woman</p>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-brand sm:text-5xl">
                EVHERFIT Infinity Band
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <span className="text-accent" aria-label="4.9 out of 5 stars">★★★★★</span>
                4.9 · 214 reviews
              </p>

              <ul className="mt-6 space-y-2.5">
                {highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-[0.95rem] leading-relaxed text-foreground/80">
                    <span className="mt-0.5 text-accent">✓</span>
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <ProductBuyPanel variants={variants} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <Features />
      <Showcase />
      <Stats />

      <div className="mx-auto max-w-7xl px-6 py-24">
        {/* specs + box */}
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <section>
              <h2 className="font-display text-3xl font-bold tracking-tight text-brand">Specifications</h2>
              <dl className="mt-8 overflow-hidden rounded-3xl border border-line bg-card">
                {specs.map(([k, v], i) => (
                  <div
                    key={k}
                    className={`grid gap-1 px-6 py-4 sm:grid-cols-[220px_1fr] ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <dt className="text-sm font-semibold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="text-[0.95rem]">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </Reveal>

          <Reveal delay={0.15}>
            <section>
              <h2 className="font-display text-3xl font-bold tracking-tight text-brand">In the box</h2>
              <ul className="mt-8 space-y-4 rounded-3xl border border-line bg-card p-8">
                {[
                  "2 × EVHERFIT Infinity Bands (your chosen weight)",
                  "Carry pouch in brand indigo",
                  "Quick-start movement guide (12 exercises)",
                  "Warranty card",
                ].map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-foreground/80">
                    <span className="text-accent">∞</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        </div>
      </div>

      <Pricing variants={variants} />

      <div className="mx-auto max-w-7xl px-6 pb-24">
        {/* FAQ */}
        <Reveal>
          <section className="max-w-3xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand">Questions, answered</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-line bg-card px-6 py-5 transition-colors open:border-brand/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold text-foreground marker:hidden">
                    {f.q}
                    <span className="ml-4 text-brand transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </Reveal>
      </div>

      <Footer />
    </main>
  );
}
