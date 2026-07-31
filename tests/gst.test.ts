import { describe, it, expect } from "vitest";
import { gstSplit, GST_RATE } from "@everfit/core/lib/revenue";

/**
 * Prices are GST-inclusive, so gstSplit must reverse the tax out of the total.
 * The taxable base + GST must always reconstruct the original amount exactly
 * (no rounding drift), because it prints on invoices and the CSV export.
 */
describe("gstSplit", () => {
  it("defaults to 18%", () => {
    expect(GST_RATE).toBe(0.18);
  });

  it("splits a ₹1,499 order (149900 paise) at 18%", () => {
    const { taxable, gst, rate } = gstSplit(149900);
    expect(taxable).toBe(127034); // round(149900 / 1.18)
    expect(gst).toBe(22866);
    expect(rate).toBe(0.18);
  });

  it("taxable + gst always reconstructs the total exactly", () => {
    for (const amount of [0, 1, 99, 149900, 199900, 249900, 399900, 1_234_567]) {
      const { taxable, gst } = gstSplit(amount);
      expect(taxable + gst).toBe(amount);
    }
  });

  it("handles zero", () => {
    expect(gstSplit(0)).toEqual({ taxable: 0, gst: 0, rate: 0.18 });
  });
});
