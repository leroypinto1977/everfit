"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { m } from "motion/react";
import { InfinityMark } from "@everfit/core/components/Logo";
import { inr, variantImages, PRODUCT_NAME, type Variant } from "@everfit/core/lib/product";
import { gaItem, stashPurchase, trackAddPaymentInfo, trackBeginCheckout } from "@everfit/core/lib/analytics";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const fields = [
  { name: "name", label: "Full name", type: "text", span: 2, autoComplete: "name" },
  { name: "email", label: "Email", type: "email", span: 1, autoComplete: "email", inputMode: "email" },
  { name: "phone", label: "Phone", type: "tel", span: 1, autoComplete: "tel", inputMode: "tel" },
  { name: "address", label: "Address", type: "text", span: 2, autoComplete: "street-address" },
  { name: "city", label: "City", type: "text", span: 1, autoComplete: "address-level2" },
  { name: "state", label: "State", type: "text", span: 1, autoComplete: "address-level1" },
  { name: "pincode", label: "PIN code", type: "text", span: 2, autoComplete: "postal-code", inputMode: "numeric" },
] as const;

function CheckoutContent({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const pick = (key: string | null) =>
    variants.find((v) => v.key === key && !v.soldOut) ??
    variants.find((v) => v.popular && !v.soldOut) ??
    variants.find((v) => !v.soldOut) ??
    variants[0];
  const [variantKey, setVariantKey] = useState(pick(params.get("w")).key);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const variant = variants.find((v) => v.key === variantKey) ?? pick(null);
  // a discount is tied to a price, so drop it whenever the variant changes
  const discount = coupon && variant ? Math.min(coupon.discount, variant.price) : 0;
  const total = variant.price - discount;

  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackBeginCheckout(gaItem(variant, PRODUCT_NAME), total / 100, coupon?.code);
  }, [variant, total, coupon]);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, variant: variant.key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoupon(null);
        setCouponMsg(data.error ?? "That code isn't valid.");
      } else {
        setCoupon({ code: data.code, discount: data.discount });
        setCouponMsg(null);
      }
    } catch {
      setCouponMsg("Couldn't check that code. Try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMsg(null);
  }

  // A coupon's discount is computed server-side against a specific variant price,
  // so it can't carry over to a different one — drop it (and let the shopper
  // re-apply) whenever the selected variant changes, keeping the shown total in
  // sync with what /api/checkout will actually charge.
  function selectVariant(key: string) {
    setVariantKey(key);
    if (coupon) {
      setCoupon(null);
      setCouponMsg("Discount removed — re-apply your code for this option.");
    }
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, variant: variant.key, coupon: coupon?.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      // data.amount is the server-computed charge in paise — the authoritative
      // value for analytics, not the client's price math.
      trackAddPaymentInfo(gaItem(variant, PRODUCT_NAME), data.amount / 100, coupon?.code);

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "EVHERFIT",
        description: `EVHERFIT Infinity Band — ${variant.weight}`,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#2b337d" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verify.ok) {
            // /success flushes this exactly once as the GA4 purchase event
            stashPurchase({
              transactionId: response.razorpay_order_id,
              value: data.amount / 100,
              coupon: coupon?.code,
              items: [gaItem(variant, PRODUCT_NAME)],
            });
            router.push(`/success?order=${response.razorpay_order_id}`);
          } else {
            setError("Payment verification failed. If money was deducted it will be auto-refunded.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 text-brand">
            <InfinityMark className="h-5" />
            <span className="font-display text-xl font-bold">EVHERFIT</span>
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-muted">🔒 Secure checkout</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1fr_420px]">
        {/* form */}
        <m.form
          onSubmit={pay}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.21, 0.65, 0.36, 1] }}
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            Shipping details
          </h1>
          <p className="mt-2 text-muted">
            No account needed. We&apos;ll send order updates to your email and phone.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {fields.map((f, i) => (
              <m.div
                key={f.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
                className={f.span === 2 ? "sm:col-span-2" : ""}
              >
                <label htmlFor={f.name} className="mb-2 block text-sm text-muted">
                  {f.label}
                </label>
                <input
                  id={f.name}
                  type={f.type}
                  required
                  autoComplete={f.autoComplete}
                  inputMode={"inputMode" in f ? f.inputMode : undefined}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="w-full rounded-xl border border-line bg-card px-4 py-3.5 outline-none transition-all focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
                />
              </m.div>
            ))}
          </div>

          {error && (
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </m.p>
          )}

          <m.button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-full bg-brand py-4 font-display text-lg font-bold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "Opening payment…" : `Pay ${inr(total)}`}
          </m.button>

          <p className="mt-4 text-center text-xs text-muted">
            UPI · Cards · Netbanking · EMI · processed by Razorpay
          </p>
        </m.form>

        {/* order summary */}
        <m.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.65, 0.36, 1] }}
          className="h-fit rounded-3xl border border-line bg-card p-8 shadow-[0_2px_20px_rgba(43,51,125,0.06)]"
        >
          <div className="mx-auto w-44">
            <Image
              src={variantImages(variant.key)[0]}
              alt={`EVHERFIT Infinity Band — ${variant.weight}`}
              width={1600}
              height={1066}
              sizes="176px"
              className="h-auto w-full rounded-2xl border border-line object-cover"
            />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-brand">EVHERFIT Infinity Band</h2>
          <p className="mt-1 text-sm text-muted">Be the woman · Resistance band set</p>

          {/* weight picker */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {variants.map((v) => (
              <button
                key={v.key}
                type="button"
                disabled={v.soldOut}
                onClick={() => selectVariant(v.key)}
                className={`rounded-xl border px-2 py-2.5 text-center transition-all ${
                  v.key === variant.key
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-card text-muted hover:border-brand/40"
                } ${v.soldOut ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <span className="block font-display text-sm font-bold">{v.weight}</span>
                <span className={`block text-[0.65rem] uppercase tracking-wider ${v.key === variant.key ? "text-white/70" : ""}`}>
                  {v.soldOut ? "Sold out" : v.label}
                </span>
              </button>
            ))}
          </div>

          {/* coupon */}
          <div className="mt-6 border-t border-line pt-6">
            {coupon && discount > 0 ? (
              <div className="flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3 text-sm">
                <span className="font-semibold text-accent">
                  {coupon.code} applied
                  <span className="block text-xs font-normal text-accent/80">−{inr(discount)}</span>
                </span>
                <button type="button" onClick={clearCoupon} className="text-xs text-accent underline-offset-2 hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Discount code"
                  inputMode="text"
                  autoCapitalize="characters"
                  className="w-full rounded-xl border border-line bg-card px-4 py-2.5 text-base uppercase outline-none transition-all focus:border-brand/60 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="shrink-0 rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white disabled:opacity-50"
                >
                  {couponLoading ? "…" : "Apply"}
                </button>
              </div>
            )}
            {couponMsg && <p className="mt-2 text-xs text-red-600">{couponMsg}</p>}
          </div>

          <dl className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
            {/* With no MRP set there is no launch discount to show, so the
                set price is the plain price rather than a struck-through one. */}
            <div className="flex justify-between">
              <dt className="text-muted">Price (set)</dt>
              {variant.mrp != null && variant.mrp > variant.price ? (
                <dd className="line-through opacity-50">{inr(variant.mrp)}</dd>
              ) : (
                <dd>{inr(variant.price)}</dd>
              )}
            </div>
            {variant.mrp != null && variant.mrp > variant.price && (
              <div className="flex justify-between">
                <dt className="text-muted">Launch discount</dt>
                <dd className="text-accent">−{inr(variant.mrp - variant.price)}</dd>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Code {coupon?.code}</dt>
                <dd className="text-accent">−{inr(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-accent">Free</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-lg font-bold text-brand">
              <dt>Total</dt>
              <dd>{inr(total)}</dd>
            </div>
          </dl>
        </m.aside>
      </div>
    </main>
  );
}

export default function CheckoutClient({ variants }: { variants: Variant[] }) {
  return (
    <Suspense>
      <CheckoutContent variants={variants} />
    </Suspense>
  );
}
