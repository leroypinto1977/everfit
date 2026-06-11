const items = [
  "14-day battery",
  "110+ workout modes",
  "5 ATM water resistant",
  "24/7 heart rate",
  "Sleep stages",
  "SpO2 monitoring",
  "AMOLED display",
  "Free shipping",
];

export default function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-line bg-card py-5">
      <div className="animate-marquee flex w-max items-center gap-12 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-sm uppercase tracking-[0.25em] text-muted">
            {item}
            <span className="text-accent">✦</span>
          </span>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
