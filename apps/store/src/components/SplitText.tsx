/**
 * Splits a headline into words and reveals each one rising out of an
 * overflow-hidden mask, staggered.
 *
 * Driven by CSS, not Motion, and deliberately not a client component: this is
 * the hero headline, so it is what First Contentful Paint waits on. A Motion
 * `initial={{ y: "110%" }}` leaves every word parked outside its mask until the
 * bundle has downloaded and hydrated — on a phone that is seconds of blank
 * page. A CSS animation starts on the first painted frame instead.
 */
export default function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.06,
}: {
  text: string;
  className?: string;
  /** seconds before the first word rises */
  delay?: number;
  /** seconds between words */
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <span
            className="anim-word inline-block will-change-transform"
            style={{ animationDelay: `${delay + i * stagger}s` }}
            aria-hidden
          >
            {word}
          </span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
