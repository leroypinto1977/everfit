import { describe, it, expect } from "vitest";
import { gstBreakdown, gstSplit } from "@everfit/core/lib/tax";

/**
 * The seller's state is passed in rather than read from the env at module load,
 * because it is an owner-editable setting now — so these cases no longer need to
 * stub the environment and re-import. The invariant everywhere: the
 * CGST/SGST/IGST parts plus the taxable base must reconstruct the original
 * inclusive amount exactly.
 */
describe("gstBreakdown", () => {
  it("is undetermined (combined GST only) when no seller state is configured", () => {
    const b = gstBreakdown(149900, { customerState: "Kerala", storeState: "" });
    expect(b.interState).toBeNull();
    expect(b.cgst + b.sgst + b.igst).toBe(0);
    expect(b.taxable + b.gst).toBe(149900);
  });

  it("intra-state splits into equal CGST + SGST (case/space-insensitive)", () => {
    const b = gstBreakdown(149900, { customerState: "  karnataka ", storeState: "Karnataka" });
    expect(b.interState).toBe(false);
    expect(b.igst).toBe(0);
    expect(b.cgst + b.sgst).toBe(b.gst);
    expect(b.cgst).toBe(Math.round(b.gst / 2));
    expect(b.taxable + b.cgst + b.sgst).toBe(149900);
  });

  it("inter-state charges a single IGST", () => {
    const b = gstBreakdown(149900, { customerState: "Kerala", storeState: "Karnataka" });
    expect(b.interState).toBe(true);
    expect(b.igst).toBe(b.gst);
    expect(b.cgst + b.sgst).toBe(0);
    expect(b.taxable + b.igst).toBe(149900);
  });

  it("is undetermined when the order has no state", () => {
    expect(gstBreakdown(149900, { customerState: "", storeState: "Karnataka" }).interState).toBeNull();
    expect(gstBreakdown(149900, { customerState: undefined, storeState: "Karnataka" }).interState).toBeNull();
  });

  it("is undetermined when the seller state is omitted entirely", () => {
    expect(gstBreakdown(149900, { customerState: "Kerala" }).interState).toBeNull();
  });
});

/**
 * The rate is snapshotted onto each order at payment, so historical amounts
 * must split at the rate they carry — not at whatever the live setting says.
 */
describe("per-order GST rate", () => {
  it("splits at the supplied rate rather than the configured default", () => {
    const at12 = gstSplit(112000, 0.12);
    expect(at12.taxable).toBe(100000);
    expect(at12.gst).toBe(12000);
    expect(at12.rate).toBe(0.12);

    const at18 = gstSplit(118000, 0.18);
    expect(at18.taxable).toBe(100000);
    expect(at18.gst).toBe(18000);
  });

  it("reconstructs the inclusive amount exactly at any rate", () => {
    for (const rate of [0, 0.05, 0.12, 0.18, 0.28]) {
      for (const amount of [1, 999, 149900, 249999]) {
        const { taxable, gst } = gstSplit(amount, rate);
        expect(taxable + gst).toBe(amount);
      }
    }
  });

  it("carries the order's rate through the CGST/SGST split", () => {
    const b = gstBreakdown(112000, { customerState: "Karnataka", storeState: "Karnataka", rate: 0.12 });
    expect(b.rate).toBe(0.12);
    expect(b.gst).toBe(12000);
    expect(b.cgst + b.sgst).toBe(12000);
    expect(b.taxable + b.cgst + b.sgst).toBe(112000);
  });
});
