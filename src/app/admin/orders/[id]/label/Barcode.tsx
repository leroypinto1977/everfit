/**
 * Code 39 barcode as inline SVG — no dependency, prints crisply on thermal
 * printers because bars are vector rects, not a font. Digits only (plus the
 * * start/stop sentinel), which is all the label encodes (invoice number).
 *
 * Each symbol is 9 elements alternating bar/space, exactly two wide bars and
 * one wide space (the "3 of 9" rule). Wide = 3 narrow units, 1-unit gap
 * between symbols.
 */

const PATTERNS: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  "*": "nwnnwnwnn",
};

const WIDE = 3;

export default function Barcode({ value, height = 40 }: { value: string; height?: number }) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const content = `*${digits}*`;

  const rects: { x: number; w: number }[] = [];
  let x = 0;
  for (const ch of content) {
    const pattern = PATTERNS[ch];
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === "w" ? WIDE : 1;
      if (i % 2 === 0) rects.push({ x, w }); // even elements are bars, odd are spaces
      x += w;
    }
    x += 1; // inter-symbol gap
  }
  const total = x - 1; // drop the trailing gap

  return (
    <svg
      viewBox={`0 0 ${total} ${height}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: `${height}px`, display: "block" }}
      role="img"
      aria-label={`Barcode ${digits}`}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={0} width={r.w} height={height} fill="#000" />
      ))}
    </svg>
  );
}
