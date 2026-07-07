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
    <svg viewBox="0 0 342.84 151.78" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        className={draw ? "infinity-draw" : undefined}
        pathLength={1}
        d="M50.78,98.93c10.25,12.74,30.72,14.23,48.44,6,31.39-14.59,81.6-63.9,114.97-84.7,85.17-53.09,167.38,23.35,108.98,94.2-44.3,53.74-123.8,46.32-150.24-1.91l34.94-27.37c16.77,17.04,38.11,41.42,70.54,18.9,40.57-28.18,9.96-82.3-40.21-54.24-43.14,24.13-97.67,86.57-145.25,97.07C-.43,167.48-35.92,65.34,45.16,15.76c49.97-30.56,102.88-13.81,123.69,25.49l-34.63,25.85c-4.24.59-15.63-16.64-20.11-19.87-35.76-25.85-87.59,21.52-63.33,51.69Z"
        fill="currentColor"
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
