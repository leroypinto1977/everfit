import { describe, it, expect } from "vitest";
import {
  istDayStart,
  istAddDays,
  istDaysAgo,
  istMonthStart,
  istInput,
  istParseInput,
  istNoon,
} from "@everfit/core/lib/report-time";

/**
 * IST is UTC+5:30 with no DST. The instant 2026-05-31T20:30:00Z is
 * 2026-06-01T02:00:00 in IST — a deliberate boundary case: it must bucket into
 * June (IST), not May (UTC). All the "expect …18:30:00Z" values are IST midnight
 * expressed as the UTC instant (00:00 IST = previous-day 18:30 UTC).
 */
const BOUNDARY = new Date("2026-05-31T20:30:00Z"); // 02:00 IST on Jun 1
const MID_JULY = new Date("2026-07-15T09:00:00Z"); // 14:30 IST on Jul 15

describe("istInput", () => {
  it("returns the IST calendar day, not the UTC day", () => {
    expect(istInput(BOUNDARY)).toBe("2026-06-01");
  });
  it("formats a plain instant correctly", () => {
    expect(istInput(new Date("2026-07-15T09:00:00Z"))).toBe("2026-07-15");
  });
});

describe("istDayStart", () => {
  it("floors to IST midnight (as a UTC instant)", () => {
    expect(istDayStart(BOUNDARY).toISOString()).toBe("2026-05-31T18:30:00.000Z");
  });
  it("is idempotent — start of a start is the same instant", () => {
    const s = istDayStart(MID_JULY);
    expect(istDayStart(s).toISOString()).toBe(s.toISOString());
  });
});

describe("istAddDays", () => {
  it("advances exactly 24h and stays IST-midnight-aligned", () => {
    const d0 = istDayStart(MID_JULY);
    const d1 = istAddDays(d0, 1);
    expect(d1.getTime() - d0.getTime()).toBe(86_400_000);
    expect(istInput(d1)).toBe("2026-07-16");
  });
  it("goes backwards too", () => {
    expect(istInput(istAddDays(istDayStart(MID_JULY), -1))).toBe("2026-07-14");
  });
});

describe("istDaysAgo", () => {
  it("30 days before today, IST-aligned", () => {
    const from = istDaysAgo(29, MID_JULY);
    expect(istInput(from)).toBe("2026-06-16");
  });
});

describe("istMonthStart", () => {
  it("current month start is Jul 1 00:00 IST", () => {
    expect(istMonthStart(0, MID_JULY).toISOString()).toBe("2026-06-30T18:30:00.000Z");
  });
  it("11 months back rolls the year to Aug 2025", () => {
    expect(istMonthStart(11, MID_JULY).toISOString()).toBe("2025-07-31T18:30:00.000Z");
    expect(istInput(istMonthStart(11, MID_JULY))).toBe("2025-08-01");
  });
});

describe("istParseInput", () => {
  it("parses YYYY-MM-DD as IST midnight", () => {
    expect(istParseInput("2026-06-01")?.toISOString()).toBe("2026-05-31T18:30:00.000Z");
  });
  it("round-trips with istInput", () => {
    expect(istInput(istParseInput("2026-06-01")!)).toBe("2026-06-01");
  });
  it("rejects malformed input", () => {
    expect(istParseInput("nope")).toBeNull();
    expect(istParseInput("")).toBeNull();
    expect(istParseInput(undefined)).toBeNull();
  });
});

describe("istNoon", () => {
  it("stamps IST noon (06:30 UTC) so the day can't drift", () => {
    expect(istNoon("2026-07-06")?.toISOString()).toBe("2026-07-06T06:30:00.000Z");
    expect(istInput(istNoon("2026-07-06")!)).toBe("2026-07-06");
  });
  it("rejects malformed input", () => {
    expect(istNoon("2026/07/06")).toBeNull();
  });
});
