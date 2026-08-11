import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import Features from "@/components/Features";
import Showcase from "@/components/Showcase";
import Stats from "@/components/Stats";
import Pricing from "@/components/Pricing";
import Reveal from "@/components/Reveal";
import ViewItemTracker from "@/components/ViewItemTracker";
import JsonLd from "@/components/JsonLd";
import { getCatalog } from "@everfit/core/lib/catalog";
import { PRODUCT_NAME, HERO_IMAGE } from "@everfit/core/lib/product";
import { SITE_URL } from "@everfit/core/lib/site";

const DESCRIPTION =
  "Resistance band set with foam-grip handles and colour-coded resistance for toning, strength, HIIT and mobility. Choose Light 4.5 kg, Heavy 9 kg, or the Combo of both.";

export const metadata: Metadata = {
  title: "Infinity Band — resistance band set for her",
  description: DESCRIPTION,
  alternates: { canonical: "/product" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/product`,
    title: "EVHERFIT Infinity Band — resistance band set for her",
    description: DESCRIPTION,
  },
};

const highlights = [
  "Foam-grip handles that clip on with metal carabiners, set up in seconds",
  "Colour-coded resistance: pick your level, or stack both bands for more",
  "Light, packable latex band for training at home, outdoors or travelling",
  "Full-body: presses, rows, curls, squats, glute work and beyond",
];

const specs = [
  ["Resistance levels", "4.5 kg / 9 kg per band (or both in the Combo)"],
  ["In a set", "1 resistance band + 2 foam-grip handles"],
  ["Handles", "Padded foam grips on nylon straps with metal carabiner clips"],
  ["Band", "Durable latex resistance band"],
  ["Best for", "Toning, strength, HIIT, pilates, mobility & rehab"],
  ["Train anywhere", "Home, gym, park or travel; packs into a bag"],
  ["Colourway", "Palette-coded: blue (4.5 kg) & red (9 kg)"],
  ["Warranty", "1 year against manufacturing defects"],
];

const faqs = [
  {
    q: "Which resistance should I start with?",
    a: "New to resistance training? Start with Light 4.5 kg (blue) for toning, pilates and mobility. Choose Heavy 9 kg (red) if you already train and want more load. The Combo gives you both, and you can clip the bands together for even more resistance.",
  },
  {
    q: "How do the handles attach?",
    a: "Each band clips to two padded foam handles with metal carabiners, so you can attach, detach and swap bands in seconds, no tools needed.",
  },
  {
    q: "Where can I use them?",
    a: "Anywhere. The bands are light and packable, so you can train at home, in the park, at the gym or on the road. Great for presses, rows, curls, squats and glute work.",
  },
  {
    q: "What if I change my mind?",
    a: "You have 7 days from delivery for a no-questions return, and a 1-year warranty against manufacturing defects. See our returns policy for details.",
  },
];

export default async function ProductPage() {
  const { name, variants } = await getCatalog();
  const productName = name || PRODUCT_NAME;

  const purchasable = variants.filter((v) => !v.soldOut);
  const prices = (purchasable.length ? purchasable : variants).map((v) => v.price / 100);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: DESCRIPTION,
    brand: { "@type": "Brand", name: "EVHERFIT" },
    image: `${SITE_URL}${HERO_IMAGE}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "214",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: variants.length,
      availability: purchasable.length
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product`,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "The Infinity Band", item: `${SITE_URL}/product` },
    ],
  };

  return (
    <main>
      <JsonLd data={[productSchema, faqSchema, breadcrumbSchema]} />
      <ViewItemTracker variants={variants} name={productName} />
      <div className="mx-auto max-w-7xl px-6 pt-32">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            <Link href="/" className="transition-colors hover:text-brand">Home</Link> ·{" "}
            <span className="text-brand">The Infinity Band</span>
          </p>
        </Reveal>

        <ProductDetail variants={variants} name={productName} highlights={highlights} />
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
                  "Resistance band(s) for your chosen offer",
                  "2 foam-grip handles per band",
                  "Clip-on metal carabiners for quick swaps",
                  "Quick-start movement guide",
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
