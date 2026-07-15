import { NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { razorpay } from "@/lib/razorpay";
import { markPaid } from "@/lib/orders";
import { sendLowStockAlert, sendOrderNotifications } from "@/lib/notify";

/**
 * Payment reconciliation — a safety net for the (rare) case where Razorpay's
 * webhook AND the browser verify call both failed to confirm a real payment, so
 * an order is stuck in "created" while the customer was actually charged. Runs
 * on a Vercel Cron (see vercel.json). For each stuck online order it asks
 * Razorpay whether a payment was captured and, if so, marks it paid exactly
 * like the webhook would (markPaid is transition-aware, so no double emails).
 *
 * Protected by CRON_SECRET: Vercel Cron sends `Authorization: Bearer <secret>`.
 * Fails closed — without CRON_SECRET set, every request is rejected.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const RECHECK_MIN_AGE_MS = 15 * 60 * 1000; // give the webhook time first
const RECHECK_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // stop chasing very old carts
const BATCH = 50;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
  }

  const now = Date.now();
  const stuck = await db()
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status, "created"),
        eq(orders.source, "online"),
        lt(orders.createdAt, new Date(now - RECHECK_MIN_AGE_MS)),
        gte(orders.createdAt, new Date(now - RECHECK_MAX_AGE_MS))
      )
    )
    .limit(BATCH);

  let recovered = 0;
  const failedLookups: string[] = [];

  for (const { id } of stuck) {
    try {
      const payments = await razorpay().orders.fetchPayments(id);
      const captured = payments.items?.find((p) => p.status === "captured");
      if (!captured) continue;

      const { order, transitioned, lowStock } = await markPaid(id, captured.id, captured.method);
      if (order && transitioned) {
        recovered++;
        // notify like the webhook would; never let a send failure abort the sweep
        await sendOrderNotifications(order).catch(() => {});
        await sendLowStockAlert(lowStock).catch(() => {});
      }
    } catch {
      failedLookups.push(id);
    }
  }

  return NextResponse.json({
    checked: stuck.length,
    recovered,
    failedLookups,
    at: new Date(now).toISOString(),
  });
}
