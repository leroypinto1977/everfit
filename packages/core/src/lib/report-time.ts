/**
 * Reporting timezone helpers.
 *
 * The store operates in India (₹, en-IN, Razorpay INR) but Postgres/Neon runs
 * its session in UTC, so revenue must be bucketed and range-filtered in IST or
 * late-night sales land in the wrong day/month. India Standard Time is a fixed
 * +5:30 offset with no DST, so these helpers use a constant offset — no library.
 *
 * Every function returns a genuine UTC instant (a JS Date) that lines up with an
 * IST wall-clock boundary, so passing the result straight into a `paid_at >= $1`
 * comparison Just Works. For the SQL side (date_trunc bucketing), use REPORT_TZ
 * with `AT TIME ZONE` so both ends of a query agree on the same calendar.
 */

/** Named zone for Postgres `... AT TIME ZONE REPORT_TZ`. */
export const REPORT_TZ = process.env.REPORT_TIMEZONE ?? "Asia/Kolkata";

/** IST is UTC+5:30, fixed year-round. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** The IST wall-clock date for an instant, expressed as a UTC-shifted Date. */
function toIstWall(d: Date): Date {
  return new Date(d.getTime() + IST_OFFSET_MS);
}

/** Turn an IST wall-clock Date back into the real UTC instant it represents. */
function fromIstWall(wall: Date): Date {
  return new Date(wall.getTime() - IST_OFFSET_MS);
}

/** Start of the IST day containing `d` (default: now), as a UTC instant. */
export function istDayStart(d: Date = new Date()): Date {
  const wall = toIstWall(d);
  wall.setUTCHours(0, 0, 0, 0);
  return fromIstWall(wall);
}

/** Add `n` whole days to an IST-aligned instant (no DST, so 24h is exact). */
export function istAddDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

/** Start of the IST day `n` days before today, as a UTC instant. */
export function istDaysAgo(n: number, from: Date = new Date()): Date {
  return istAddDays(istDayStart(from), -n);
}

/** Start of the IST month `monthsAgo` months back (0 = current month). */
export function istMonthStart(monthsAgo = 0, from: Date = new Date()): Date {
  const wall = toIstWall(from);
  // Date.UTC normalises month under/overflow, so negative months roll the year.
  return fromIstWall(new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth() - monthsAgo, 1)));
}

/** Format an instant as the `YYYY-MM-DD` of its IST calendar day (for date inputs). */
export function istInput(d: Date): string {
  return toIstWall(d).toISOString().slice(0, 10);
}

/** Parse a `YYYY-MM-DD` string as IST midnight of that day. Returns null if malformed. */
export function istParseInput(value: string | undefined | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  const instant = fromIstWall(new Date(Date.UTC(y, mo - 1, d)));
  return isNaN(instant.getTime()) ? null : instant;
}

/**
 * IST noon of a `YYYY-MM-DD` string, for stamping a manual sale's paid date.
 * Noon (not midnight) keeps the sale firmly inside the intended IST calendar day
 * regardless of the server's own timezone. Returns null if malformed.
 */
export function istNoon(value: string | undefined | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  const instant = fromIstWall(new Date(Date.UTC(y, mo - 1, d, 12)));
  return isNaN(instant.getTime()) ? null : instant;
}

/** Start of the IST calendar year containing `from` (Jan 1, IST midnight). */
export function istYearStart(from: Date = new Date()): Date {
  const wall = toIstWall(from);
  return fromIstWall(new Date(Date.UTC(wall.getUTCFullYear(), 0, 1)));
}

/* ---------- named report ranges ---------- */

export type RangePreset = "today" | "7d" | "30d" | "90d" | "month" | "year" | "custom";

/** The preset pills the reporting screens offer, in display order. */
export const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
] as const satisfies readonly { key: RangePreset; label: string }[];

const DEFAULT_PRESET: RangePreset = "30d";

function isPreset(v: string | undefined): v is RangePreset {
  return !!v && (v === "custom" || RANGE_PRESETS.some((p) => p.key === v));
}

export interface ResolvedRange {
  from: Date; // IST midnight, inclusive
  to: Date; // IST midnight of the last day, INCLUSIVE (add a day for SQL)
  preset: RangePreset;
}

/**
 * Turn a reporting screen's `?range=`/`?from=`/`?to=` params into an IST-aligned
 * range. A named preset always wins over stale from/to left in the URL; explicit
 * dates with no preset (or `range=custom`) mean the operator picked their own.
 * Anything unrecognised falls back to the last 30 days.
 */
export function resolveRange(
  sp: { range?: string; from?: string; to?: string },
  now: Date = new Date(),
): ResolvedRange {
  const today = istDayStart(now);
  const asked = isPreset(sp.range) ? sp.range : undefined;
  const custom = sp.from || sp.to;

  // custom either by name or by the mere presence of dates without a preset
  if (asked === "custom" || (!asked && custom)) {
    return {
      from: istParseInput(sp.from) ?? istDaysAgo(29, now),
      to: istParseInput(sp.to) ?? today,
      preset: "custom",
    };
  }

  const preset = asked ?? DEFAULT_PRESET;
  switch (preset) {
    case "today":
      return { from: today, to: today, preset };
    case "7d":
      return { from: istDaysAgo(6, now), to: today, preset };
    case "90d":
      return { from: istDaysAgo(89, now), to: today, preset };
    case "month":
      return { from: istMonthStart(0, now), to: today, preset };
    case "year":
      return { from: istYearStart(now), to: today, preset };
    default:
      return { from: istDaysAgo(29, now), to: today, preset: "30d" };
  }
}
