/**
 * EVHERFIT infinity mark + wordmark, per the brand book
 * (horizontal lockup only — the mark must never rotate vertical).
 */
export function InfinityMark({
  className,
  draw = false,
}: {
  className?: string;
  draw?: boolean;
}) {
  return (
    <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        className={draw ? "infinity-draw" : undefined}
        d="M60 30 C 47 8 14 7 14 30 C 14 53 47 52 60 30 C 73 8 106 7 106 30 C 106 53 73 52 60 30"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function Logo({
  className = "",
  markClass = "h-5",
  tagline = false,
}: {
  className?: string;
  markClass?: string;
  tagline?: boolean;
}) {
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="inline-flex items-center gap-2">
        <InfinityMark className={markClass} />
        <span className="font-display text-xl font-bold tracking-tight">EVHERFIT</span>
      </span>
      {tagline && (
        <span className="mt-1 text-[0.6rem] uppercase tracking-[0.45em] text-muted">
          Be the woman
        </span>
      )}
    </span>
  );
}
