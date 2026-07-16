/**
 * GA4 e-commerce events, pushed to the GTM dataLayer.
 *
 * Events always push to window.dataLayer — before GTM is connected they just
 * accumulate in the array, so wiring the container later (NEXT_PUBLIC_GTM_ID,
 * see src/components/GTM.tsx) needs no further code changes. Monetary values
 * are rupees (GA4 convention), converted from the paise the app stores.
 */

export interface GaItem {
  item_id: string;
  item_name: string;
  item_variant: string;
  price: number; // rupees
  quantity: number;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function push(event: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer ??= [];
  // GA4 pattern: clear the previous ecommerce object so events don't merge.
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(event);
}

export function gaItem(
  variant: { key: string; weight: string; label: string; price: number },
  productName: string,
  quantity = 1
): GaItem {
  return {
    item_id: `EVH-${variant.key}`,
    item_name: productName,
    item_variant: `${variant.weight} (${variant.label})`,
    price: variant.price / 100,
    quantity,
  };
}

export function trackViewItem(item: GaItem) {
  push({
    event: "view_item",
    ecommerce: { currency: "INR", value: item.price, items: [item] },
  });
}

export function trackBeginCheckout(item: GaItem, value: number, coupon?: string) {
  push({
    event: "begin_checkout",
    ecommerce: { currency: "INR", value, ...(coupon && { coupon }), items: [item] },
  });
}

export function trackAddPaymentInfo(item: GaItem, value: number, coupon?: string) {
  push({
    event: "add_payment_info",
    ecommerce: {
      currency: "INR",
      value,
      payment_type: "razorpay",
      ...(coupon && { coupon }),
      items: [item],
    },
  });
}

/**
 * Purchase handoff: /checkout stashes the transaction right before redirecting
 * and /success flushes it exactly once. The stash is the guard — typing the
 * /success URL by hand, reloading it, or revisiting from an email link finds
 * no stash and fires nothing, so conversions are never double-counted.
 */

interface PendingPurchase {
  transactionId: string;
  value: number; // rupees
  coupon?: string;
  items: GaItem[];
}

const PURCHASE_KEY = "evh:pending-purchase";

export function stashPurchase(purchase: PendingPurchase) {
  try {
    sessionStorage.setItem(PURCHASE_KEY, JSON.stringify(purchase));
  } catch {
    // storage unavailable (private mode) — lose the analytics event, not the order
  }
}

export function flushPurchase(orderId: string) {
  let purchase: PendingPurchase | null = null;
  try {
    const raw = sessionStorage.getItem(PURCHASE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PURCHASE_KEY);
    purchase = JSON.parse(raw);
  } catch {
    return;
  }
  if (!purchase || purchase.transactionId !== orderId) return;

  push({
    event: "purchase",
    ecommerce: {
      transaction_id: purchase.transactionId,
      currency: "INR",
      value: purchase.value,
      ...(purchase.coupon && { coupon: purchase.coupon }),
      items: purchase.items,
    },
  });
}
