import { InfinityMark } from "./Logo";

const items = [
  "Be the woman",
  "Fitness for life",
  "Live strong. Live long.",
  "Strong is infinite",
  "Where strength meets longevity",
  "Empower your every move",
  "Grace in motion",
  "Forever fit. Forever her.",
];

export default function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden bg-brand py-5">
      <div className="animate-marquee flex w-max items-center gap-12 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-sm uppercase tracking-[0.25em] text-white/85">
            {item}
            <InfinityMark className="h-3 text-accent" />
          </span>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-brand to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-brand to-transparent" />
    </div>
  );
}
