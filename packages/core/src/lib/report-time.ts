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
