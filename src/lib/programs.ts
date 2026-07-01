/**
 * The two EVHERFIT coaching programs. These live on separate sites
 * (evherfit.com and 1-to-1.evherfit.com) — the main storefront only
 * teases them and links out. Keep copy + URLs here so they're easy to update.
 */
export type Program = {
  key: string;
  badge: string;
  name: string;
  tagline: string;
  desc: string;
  points: string[];
  cta: string;
  href: string;
  /** which accent the card leans on */
  tone: "brand" | "accent";
};

export const PROGRAMS: Program[] = [
  {
    key: "challenge",
    badge: "Group · Live",
    name: "The 4-Week Challenge",
    tagline: "Eat idli, dosa, rice — and still lose weight in 4 weeks.",
    desc:
      "Live morning workouts in Tamil, beginner-friendly and equipment-free. Daily WhatsApp accountability, weekly recipes and habit templates included.",
    points: [
      "6:30 AM live on Zoom, Mon–Fri · recordings included",
      "No equipment · joint-friendly · all fitness levels",
      "₹10,000+ in bonuses · from ₹599",
    ],
    cta: "Join the Challenge",
    href: "https://evherfit.com/",
    tone: "brand",
  },
  {
    key: "one-to-one",
    badge: "1-to-1 · Personalised",
    name: "One-to-One Coaching",
    tagline: "Your fittest self — faster.",
    desc:
      "A personalised plan from Manjula and her team: custom workouts, a clinical nutritionist and daily accountability. Lose up to 10 kg in 90 days, organically.",
    points: [
      "Personalised workout + diet plan",
      "Trainer, nutritionist & accountability partner",
      "Visible results in the first month",
    ],
    cta: "Book a discovery call",
    href: "https://1-to-1.evherfit.com/",
    tone: "accent",
  },
];
