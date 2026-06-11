"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import BandVisual from "@/components/BandVisual";
import { InfinityMark } from "@/components/Logo";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const fields = [
  { name: "name", label: "Full name", type: "text", span: 2 },
  { name: "email", label: "Email", type: "email", span: 1 },
  { name: "phone", label: "Phone", type: "tel", span: 1 },
  { name: "address", label: "Address", type: "text", span: 2 },
  { name: "city", label: "City", type: "text", span: 1 },
  { name: "state", label: "State", type: "text", span: 1 },
  { name: "pincode", label: "PIN code", type: "text", span: 2 },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "EVHERFIT",
        description: "EVHERFIT Pulse fitness band",
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

      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <InfinityMark className="h-5 text-accent" />
            <span className="font-display text-xl font-bold">EVHERFIT</span>
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-muted">🔒 Secure checkout</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1fr_420px]">
        {/* form */}
        <motion.form
          onSubmit={pay}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.21, 0.65, 0.36, 1] }}
        >
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Shipping details
          </h1>
          <p className="mt-2 text-muted">
            No account needed — we&apos;ll send order updates to your email and phone.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {fields.map((f, i) => (
              <motion.div
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
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="w-full rounded-xl border border-line bg-card px-4 py-3.5 outline-none transition-all focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
                />
              </motion.div>
            ))}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 w-full rounded-full bg-accent py-4 font-display text-lg font-bold text-background disabled:opacity-60"
          >
            {loading ? "Opening payment…" : "Pay ₹2,999"}
          </motion.button>

          <p className="mt-4 text-center text-xs text-muted">
            UPI · Cards · Netbanking · EMI — processed by Razorpay
          </p>
        </motion.form>

        {/* order summary */}
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.65, 0.36, 1] }}
          className="h-fit rounded-3xl border border-line bg-card p-8"
        >
          <div className="mx-auto w-32">
            <BandVisual screen="heart" className="w-full" />
          </div>
          <h2 className="mt-6 font-display text-xl font-bold">EVHERFIT Pulse</h2>
          <p className="mt-1 text-sm text-muted">Be the woman · Infinite Indigo</p>

          <dl className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Price</dt>
              <dd className="line-through opacity-50">₹4,999</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Launch discount</dt>
              <dd className="text-accent">−₹2,000</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-accent">Free</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-lg font-bold">
              <dt>Total</dt>
              <dd>₹2,999</dd>
            </div>
          </dl>
        </motion.aside>
      </div>
    </main>
  );
}
