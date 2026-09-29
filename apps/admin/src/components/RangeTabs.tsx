import Link from "next/link";
import { RANGE_PRESETS, istInput, type ResolvedRange } from "@everfit/core/lib/report-time";

/**
 * Date-range picker for the reporting screens: preset pills plus a custom
 * from/to form. Pure links + a GET form, so it needs no client JS — the page it
 * sits on re-renders on the server with the new `?range=`.
 */
export default function RangeTabs({
  basePath,
  range,
}: {
  basePath: string; // the screen's own path, e.g. "/revenue"
  range: ResolvedRange;
}) {
  const { from, to, preset } = range;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div role="tablist" aria-label="Date range" className="flex flex-wrap gap-1 rounded-xl bg-[#eef0f8] p-1">
        {RANGE_PRESETS.map((p) => {
          const active = preset === p.key;
          return (
            <Link
              key={p.key}
              href={`${basePath}?range=${p.key}`}
              role="tab"
              aria-selected={active}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-white text-[#2b337d] shadow-sm" : "text-[#6b7194] hover:text-[#2b337d]"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
        {preset === "custom" && (
          <span
            role="tab"
            aria-selected
            className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-[#2b337d] shadow-sm"
          >
            Custom
          </span>
        )}
      </div>

      <form action={basePath} className="flex flex-wrap items-end gap-3">
        {/* keeps a stale preset from overriding the dates on submit */}
        <input type="hidden" name="range" value="custom" />
        <div>
          <label htmlFor="from" className="mb-1 block text-xs text-[#6b7194]">
            From
          </label>
          <input
            id="from"
            type="date"
            name="from"
            defaultValue={istInput(from)}
            className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d]"
          />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-xs text-[#6b7194]">
            To
          </label>
          <input
            id="to"
            type="date"
            name="to"
            defaultValue={istInput(to)}
            className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d]"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-[#dcdfee] bg-white px-5 py-2 text-sm font-semibold text-[#4a5072] hover:border-[#2b337d]/40"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
