"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order");

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand/10 blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.21, 0.65, 0.36, 1] }}
        className="relative max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand text-4xl text-white"
        >
          ✓
        </motion.div>

        <h1 className="mt-8 font-display text-4xl font-bold tracking-tight text-brand">Order confirmed!</h1>
        <p className="mt-4 leading-relaxed text-muted">
          Your EVHERFIT Infinity Band pair is on its way. We&apos;ve emailed your receipt and will
          text tracking details once it ships — usually within 24 hours.
        </p>

        {orderId && (
          <p className="mt-6 rounded-xl border border-line bg-card px-4 py-3 font-mono text-sm text-muted">
            Order ID: <span className="text-foreground">{orderId}</span>
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-block rounded-full bg-brand px-8 py-4 font-display font-bold text-white transition hover:brightness-95"
          >
            Back to home
          </Link>
          <Link href="/track" className="text-sm text-brand underline-offset-2 hover:underline">
            Track this order →
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
