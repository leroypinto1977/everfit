import Link from "next/link";
import { InfinityMark } from "./Logo";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/product", label: "The Infinity Band" },
      { href: "/#pricing", label: "Weights & pricing" },
      { href: "/checkout", label: "Checkout" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/track", label: "Track your order" },
      { href: "/contact", label: "Contact us" },
      { href: "/refunds", label: "Returns & refunds" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-brand-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <span className="flex items-center gap-2.5">
            <InfinityMark className="h-6 text-accent" />
            <span className="font-display text-2xl font-bold tracking-tight">EVHERFIT</span>
          </span>
          <p className="mt-2 text-xs uppercase tracking-[0.4em] text-white/60">Be the woman</p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/65">
            Weighted resistance bands designed for her, built for life. Strong is
            infinite.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">
              {col.title}
            </h3>
            <ul className="mt-5 space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/75 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-white/55 sm:flex-row">
          <p>© {new Date().getFullYear()} Evherfit. All rights reserved.</p>
          <p className="text-xs uppercase tracking-[0.15em]">
            Secure payments · UPI · Cards · Netbanking · EMI
          </p>
        </div>
      </div>
    </footer>
  );
}
