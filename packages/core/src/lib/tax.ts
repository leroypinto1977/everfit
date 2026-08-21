/**
 * Indian GST helpers. Prices are GST-inclusive, so the tax is reversed out of
 * the total. For a compliant tax invoice the tax also splits by place of supply:
 *   - intra-state (customer state == seller state): CGST + SGST, half each
 *   - inter-state (customer state != seller state): a single IGST
 * When STORE_STATE is unset we can't determine that, so callers fall back to a
 * single combined "GST" line (still correct in total, just not split).
 */

/** Combined GST rate on the sale (e.g. 0.18 = 18%). */
export const GST_RATE = Number(process.env.GST_RATE ?? 0.18);

/**
 * HSN code for the product, printed on the invoice. Still env-only: it is a
 * product attribute rather than a store-wide policy, so it belongs on the
 * variant, not in the settings table.
 */
export const HSN_CODE = process.env.HSN_CODE?.trim() || "";

/*
 * The seller's state and GSTIN used to be module constants read from the env at
 * import time. They are owner-editable settings now (see lib/settings.ts), so
 * they are passed in explicitly instead — a module constant would be captured
 * once per process and never see an edit made in the admin panel.
 */

/** Reverse the tax out of a GST-inclusive amount (paise). */
export function gstSplit(inclusivePaise: number) {
  const taxable = Math.round(inclusivePaise / (1 + GST_RATE));
  return { taxable, gst: inclusivePaise - taxable, rate: GST_RATE };
}

function normState(s: string | undefined | null) {
  return (s ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Inter-state when the customer's state differs from the seller's. Returns
 * `null` when we can't tell (no seller state configured, or the order has no
 * state) — the caller should then show a single combined GST line.
 */
export function isInterState(
  customerState: string | undefined | null,
  storeState: string | undefined | null
): boolean | null {
  if (!storeState?.trim() || !customerState?.trim()) return null;
  return normState(customerState) !== normState(storeState);
}

export interface GstBreakdown {
  taxable: number;
  gst: number; // combined
  cgst: number;
  sgst: number;
  igst: number;
  interState: boolean | null; // null = undetermined (show combined line)
  rate: number;
}

/**
 * Full CGST/SGST/IGST breakdown for one GST-inclusive amount. `storeState` is
 * the seller's state of supply, resolved from settings by the caller.
 */
export function gstBreakdown(
  inclusivePaise: number,
  customerState?: string | null,
  storeState?: string | null
): GstBreakdown {
  const { taxable, gst, rate } = gstSplit(inclusivePaise);
  const inter = isInterState(customerState, storeState);
  if (inter === true) {
    return { taxable, gst, cgst: 0, sgst: 0, igst: gst, interState: true, rate };
  }
  if (inter === false) {
    const cgst = Math.round(gst / 2);
    return { taxable, gst, cgst, sgst: gst - cgst, igst: 0, interState: false, rate };
  }
  return { taxable, gst, cgst: 0, sgst: 0, igst: 0, interState: null, rate };
}
