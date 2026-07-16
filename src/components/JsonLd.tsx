/**
 * Renders a schema.org JSON-LD block. Server-safe (no client JS needed) — the
 * markup ships in the initial HTML so crawlers read it without executing scripts.
 * `data` is stringified as-is; keep it to plain JSON-serialisable objects.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is trusted, app-authored content — not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
