import { InfinityMark } from "./Logo";

const items = [
  "Be the woman",
  "14-day battery",
  "Cycle insights",
  "110+ workout modes",
  "5 ATM water resistant",
  "24/7 heart rate",
  "Sleep stages",
  "Strong is infinite",
];

export default function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-line bg-card py-5">
      <div className="animate-marquee flex w-max items-center gap-12 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-sm uppercase tracking-[0.25em] text-muted">
            {item}
            <InfinityMark className="h-3 text-accent" />
          </span>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
