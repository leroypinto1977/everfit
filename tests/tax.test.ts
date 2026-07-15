import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * tax.ts reads STORE_STATE at module load, so each case stubs the env and
 * re-imports a fresh module. The invariant everywhere: the CGST/SGST/IGST parts
 * plus the taxable base must reconstruct the original inclusive amount exactly.
 */
describe("gstBreakdown", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it("is undetermined (combined GST only) when STORE_STATE is unset", async () => {
    vi.stubEnv("STORE_STATE", "");
    const { gstBreakdown } = await import("@/lib/tax");
    const b = gstBreakdown(149900, "Kerala");
    expect(b.interState).toBeNull();
    expect(b.cgst + b.sgst + b.igst).toBe(0);
    expect(b.taxable + b.gst).toBe(149900);
  });

  it("intra-state splits into equal CGST + SGST (case/space-insensitive)", async () => {
    vi.stubEnv("STORE_STATE", "Karnataka");
    const { gstBreakdown } = await import("@/lib/tax");
    const b = gstBreakdown(149900, "  karnataka ");
    expect(b.interState).toBe(false);
    expect(b.igst).toBe(0);
    expect(b.cgst + b.sgst).toBe(b.gst);
    expect(b.cgst).toBe(Math.round(b.gst / 2));
    expect(b.taxable + b.cgst + b.sgst).toBe(149900);
  });

  it("inter-state charges a single IGST", async () => {
    vi.stubEnv("STORE_STATE", "Karnataka");
    const { gstBreakdown } = await import("@/lib/tax");
    const b = gstBreakdown(149900, "Kerala");
    expect(b.interState).toBe(true);
    expect(b.igst).toBe(b.gst);
    expect(b.cgst + b.sgst).toBe(0);
    expect(b.taxable + b.igst).toBe(149900);
  });

  it("is undetermined when the order has no state", async () => {
    vi.stubEnv("STORE_STATE", "Karnataka");
    const { gstBreakdown } = await import("@/lib/tax");
    expect(gstBreakdown(149900, "").interState).toBeNull();
    expect(gstBreakdown(149900, undefined).interState).toBeNull();
  });
});
