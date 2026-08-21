import { describe, it, expect } from "vitest";
import { gstBreakdown } from "@everfit/core/lib/tax";

/**
 * The seller's state is passed in rather than read from the env at module load,
 * because it is an owner-editable setting now — so these cases no longer need to
 * stub the environment and re-import. The invariant everywhere: the
 * CGST/SGST/IGST parts plus the taxable base must reconstruct the original
 * inclusive amount exactly.
 */
describe("gstBreakdown", () => {
  it("is undetermined (combined GST only) when no seller state is configured", () => {
    const b = gstBreakdown(149900, "Kerala", "");
    expect(b.interState).toBeNull();
    expect(b.cgst + b.sgst + b.igst).toBe(0);
    expect(b.taxable + b.gst).toBe(149900);
  });

  it("intra-state splits into equal CGST + SGST (case/space-insensitive)", () => {
    const b = gstBreakdown(149900, "  karnataka ", "Karnataka");
    expect(b.interState).toBe(false);
    expect(b.igst).toBe(0);
    expect(b.cgst + b.sgst).toBe(b.gst);
    expect(b.cgst).toBe(Math.round(b.gst / 2));
    expect(b.taxable + b.cgst + b.sgst).toBe(149900);
  });

  it("inter-state charges a single IGST", () => {
    const b = gstBreakdown(149900, "Kerala", "Karnataka");
    expect(b.interState).toBe(true);
    expect(b.igst).toBe(b.gst);
    expect(b.cgst + b.sgst).toBe(0);
    expect(b.taxable + b.igst).toBe(149900);
  });

  it("is undetermined when the order has no state", () => {
    expect(gstBreakdown(149900, "", "Karnataka").interState).toBeNull();
    expect(gstBreakdown(149900, undefined, "Karnataka").interState).toBeNull();
  });

  it("is undetermined when the seller state is omitted entirely", () => {
    expect(gstBreakdown(149900, "Kerala").interState).toBeNull();
  });
});
