/**
 * Indian GST helpers. Prices are GST-inclusive, so the tax is reversed out of
 * the total. For a compliant tax invoice the tax also splits by place of supply:
 *   - intra-state (customer state == seller state): CGST + SGST, half each
 *   - inter-state (customer state != seller state): a single IGST
 * When STORE_STATE is unset we can't determine that, so callers fall back to a
 * single combined "GST" line (still correct in total, just not split).
 */

/**
 * Default combined GST rate from the environment (e.g. 0.18 = 18%).
 *
 * This is the FALLBACK, not the authority. The rate actually charged on an
 * order is snapshotted onto `orders.gst_rate` when it is paid, and the rate for
 * a NEW sale comes from settings (see getGstRate in lib/settings.ts). Reading
 * this constant to re-derive tax on a historical order would reintroduce the
 * bug the snapshot exists to prevent.
 */
export const GST_RATE = Number(process.env.GST_RATE ?? 0.18);

/**
 * The rate in force before per-order snapshotting began (migration 0009).
 * Frozen on purpose: it is the correct rate for any row whose `gst_rate` is
 * still NULL, and it must not drift when the live rate changes.
 */
export const LEGACY_GST_RATE = 0.18;

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

/**
 * Reverse the tax out of a GST-inclusive amount (paise) at `rate`.
 *
 * Pass the order's own snapshotted rate whenever you have one. The default
 * exists for callers with no order in hand (a price preview, say) and for the
 * unit tests.
 */
export function gstSplit(inclusivePaise: number, rate: number = GST_RATE) {
  const taxable = Math.round(inclusivePaise / (1 + rate));
  return { taxable, gst: inclusivePaise - taxable, rate };
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

export interface GstBreakdownOptions {
  /** The customer's state, from the order's shipping address. */
  customerState?: string | null;
  /** The seller's state of supply, resolved from settings by the caller. */
  storeState?: string | null;
  /** The order's snapshotted rate. Omit only when there is no order. */
  rate?: number;
}

/**
 * Full CGST/SGST/IGST breakdown for one GST-inclusive amount.
 *
 * Takes an options object rather than a run of positional arguments because
 * `gstBreakdown(amount, a, b, c)` at a call site says nothing about which of
 * those is the customer's state and which is the seller's — and swapping them
 * silently inverts intra-state and inter-state on a tax invoice.
 */
export function gstBreakdown(inclusivePaise: number, opts: GstBreakdownOptions = {}): GstBreakdown {
  const { customerState, storeState } = opts;
  const { taxable, gst, rate } = gstSplit(inclusivePaise, opts.rate ?? GST_RATE);
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
