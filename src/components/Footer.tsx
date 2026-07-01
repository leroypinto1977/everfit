import Link from "next/link";
import { InfinityMark } from "./Logo";

const columns = [
  {
    title: "Programs",
    links: [
      { href: "https://evherfit.com/", label: "4-Week Challenge", external: true },
      { href: "https://1-to-1.evherfit.com/", label: "One-to-One Coaching", external: true },
      { href: "/#story", label: "Our story" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/product", label: "The Infinity Band" },
      { href: "/product#pricing", label: "Weights & pricing" },
      { href: "/checkout", label: "Checkout" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/track", label: "Track your order" },
      { href: "/contact", label: "Contact us" },
      { href: "/shipping", label: "Shipping policy" },
      { href: "/refunds", label: "Cancellations & refunds" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms & conditions" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-brand-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
          <span className="flex items-center gap-2.5">
            <InfinityMark className="h-6 text-accent" />
            <span className="font-display text-2xl font-bold tracking-tight">EVHERFIT</span>
          </span>
          <p className="mt-2 text-xs uppercase tracking-[0.4em] text-white/60">Be the woman</p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/65">
            Women-centred fitness for lifelong strength, vitality and longevity —
            live programs, personal coaching and gear built for her.
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
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-white/75 transition-colors hover:text-white"
                    >
                      {l.label}
                      <span className="text-[0.7em] text-white/40">↗</span>
                    </a>
                  ) : (
                    <Link href={l.href} className="text-sm text-white/75 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  )}
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
