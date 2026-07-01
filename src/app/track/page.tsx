"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Footer from "@/components/Footer";

interface TrackResult {
  id: string;
  status: "created" | "paid" | "failed" | "shipped" | "delivered" | "cancelled" | "refunded";
  item: string;
  city: string;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  tracking: string | null;
  courier: string | null;
  trackingUrl: string | null;
}

const steps = [
  { key: "created", label: "Order placed", icon: "🛒" },
  { key: "paid", label: "Payment confirmed", icon: "✓" },
  { key: "shipped", label: "Shipped", icon: "📦" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
] as const;

const stepIndex: Record<TrackResult["status"], number> = {
  created: 0,
  failed: 0,
  cancelled: 0,
  paid: 1,
  refunded: 1,
  shipped: 2,
  delivered: 3,
};

function fmt(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function TrackPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  async function track(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const reached = result ? stepIndex[result.status] : -1;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 pb-24 pt-36">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Order status</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-brand sm:text-5xl">
            Track your order
          </h1>
          <p className="mt-3 text-muted">
            Enter your order ID (from your confirmation email) and the phone number
            you used at checkout.
          </p>

          <form onSubmit={track} className="mt-8 grid gap-4 sm:grid-cols-[1.3fr_1fr_auto]">
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              placeholder="Order ID · order_…"
              className="rounded-xl border border-line bg-card px-4 py-3.5 outline-none transition-all focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
              placeholder="Phone"
              className="rounded-xl border border-line bg-card px-4 py-3.5 outline-none transition-all focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand px-6 py-3.5 font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
            >
              {loading ? "Checking…" : "Track"}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.21, 0.65, 0.36, 1] }}
                className="mt-10 rounded-3xl border border-line bg-card p-8"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-brand">{result.item}</h2>
                  <span className="font-mono text-xs text-muted">{result.id}</span>
                </div>

                {result.status === "failed" ? (
                  <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    Payment for this order failed — nothing was charged, or any deduction
                    will be auto-refunded by your bank within 5–7 days. Place the order again
                    any time.
                  </p>
                ) : result.status === "cancelled" ? (
                  <p className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-muted">
                    This order was cancelled before payment. Place a new order any time.
                  </p>
                ) : result.status === "refunded" ? (
                  <p className="mt-6 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
                    This order has been refunded — the amount typically reaches your account
                    within 5–7 working days of the refund being initiated.
                  </p>
                ) : (
                  <ol className="mt-8 space-y-0">
                    {steps.map((s, i) => {
                      const done = i <= reached;
                      const timestamp =
                        s.key === "created"
                          ? fmt(result.createdAt)
                          : s.key === "paid"
                            ? fmt(result.paidAt)
                            : s.key === "shipped"
                              ? fmt(result.shippedAt)
                              : fmt(result.deliveredAt);
                      return (
                        <li key={s.key} className="relative flex gap-4 pb-8 last:pb-0">
                          {i < steps.length - 1 && (
                            <span
                              className={`absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 ${
                                i < reached ? "bg-brand" : "bg-line"
                              }`}
                            />
                          )}
                          <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 260, damping: 18 }}
                            className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                              done ? "bg-brand text-white" : "border border-line bg-card text-muted"
                            }`}
                          >
                            {done ? "✓" : s.icon}
                          </motion.span>
                          <div className="pt-1.5">
                            <p className={`font-semibold ${done ? "text-foreground" : "text-muted"}`}>{s.label}</p>
                            {timestamp && done && <p className="text-sm text-muted">{timestamp}</p>}
                            {s.key === "shipped" && result.tracking && done && (
                              <p className="mt-1 rounded-lg bg-brand-soft px-3 py-1.5 font-mono text-xs text-brand">
                                {result.courier && <span className="mr-2 font-sans font-semibold">{result.courier}</span>}
                                {result.trackingUrl ? (
                                  <a
                                    href={result.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-2"
                                  >
                                    {result.tracking} ↗
                                  </a>
                                ) : (
                                  result.tracking
                                )}
                              </p>
                            )}
                            {s.key === "shipped" && reached === 1 && (
                              <p className="text-sm text-muted">Usually ships within 24 hours</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}

                <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
                  Shipping to {result.city}. Questions?{" "}
                  <a href="/contact" className="text-brand underline-offset-2 hover:underline">
                    Contact us
                  </a>
                  .
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
