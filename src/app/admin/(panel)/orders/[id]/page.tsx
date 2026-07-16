import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderEvents, getOrderRefunds } from "@/lib/orders";
import { getAdminUser } from "@/lib/admin-auth";
import { courierName, trackingUrl } from "@/lib/couriers";
import AutoRefresh from "@/components/admin/AutoRefresh";
import StatusBadge from "@/components/admin/StatusBadge";
import { InvoiceIcon, PrinterIcon } from "@/components/admin/icons";
import { addNoteAction } from "../actions";
import { CancelForm, DeliverForm, ShipForm } from "./FulfilmentForms";
import EmailButtons from "./EmailButtons";
import RefundForm from "./RefundForm";

export const dynamic = "force-dynamic";

const eventLabels: Record<string, string> = {
  created: "Order placed",
  paid: "Payment confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Payment failed",
  refund_initiated: "Refund initiated",
  refund_processed: "Refund processed by Razorpay",
  refund_failed: "Refund failed at Razorpay",
  email: "Email",
  note: "Note",
};

export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, events, orderRefunds, user] = await Promise.all([
    getOrder(id),
    getOrderEvents(id),
    getOrderRefunds(id),
    getAdminUser(),
  ]);
  if (!order) notFound();

  const c = order.customer;
  const trackLink = trackingUrl(order.courier, order.tracking);

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div>
        <Link href="/admin/orders" className="text-sm text-[#6b7194] hover:text-[#2b337d]">
          ← All orders
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold italic">{c.name}</h1>
            <p className="mt-1 font-mono text-sm text-[#9aa0c3]">{order.id}</p>
          </div>
          <div className="flex items-center gap-3">
            {["paid", "shipped", "delivered"].includes(order.status) && (
              <Link
                href={`/admin/orders/${order.id}/label`}
                className="inline-flex items-center gap-2 rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm text-[#4a5072] hover:border-[#2b337d]/40"
              >
                <PrinterIcon className="h-4 w-4" />
                Shipping label
              </Link>
            )}
            {order.invoiceNo && (
              <Link
                href={`/admin/orders/${order.id}/invoice`}
                className="inline-flex items-center gap-2 rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm text-[#4a5072] hover:border-[#2b337d]/40"
              >
                <InvoiceIcon className="h-4 w-4" />
                Invoice EVH-{String(order.invoiceNo).padStart(4, "0")}
              </Link>
            )}
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* fulfilment timeline */}
      {!["failed", "cancelled", "refunded"].includes(order.status) && (
        <ol className="flex flex-wrap items-center gap-2">
          {(["created", "paid", "shipped", "delivered"] as const).map((step, i) => {
            const reached = ["created", "paid", "shipped", "delivered"].indexOf(order.status) >= i;
            return (
              <li key={step} className="flex items-center gap-2">
                {i > 0 && <span className={`h-0.5 w-8 ${reached ? "bg-[#2b337d]" : "bg-[#e3e5f0]"}`} />}
                <span
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
                    reached ? "bg-[#2b337d] text-white" : "border border-[#e3e5f0] bg-white text-[#9aa0c3]"
                  }`}
                >
                  {step === "created" ? "placed" : step}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* shipping */}
        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6 lg:col-span-2">
          <h2 className="font-semibold">Shipping details</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#9aa0c3]">Phone</dt>
              <dd className="mt-1">{c.phone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-[#9aa0c3]">Email</dt>
              <dd className="mt-1">{c.email}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-[#9aa0c3]">Address</dt>
              <dd className="mt-1 leading-relaxed">
                {c.address}
                <br />
                {c.city}, {c.state} — {c.pincode}
              </dd>
            </div>
            {order.tracking && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-[#9aa0c3]">
                  Tracking {order.courier ? `· ${courierName(order.courier)}` : ""}
                </dt>
                <dd className="mt-1 font-mono">
                  {trackLink ? (
                    <a href={trackLink} target="_blank" rel="noreferrer" className="text-[#2b337d] underline">
                      {order.tracking} ↗
                    </a>
                  ) : (
                    order.tracking
                  )}
                </dd>
              </div>
            )}
          </dl>
          {order.customerId && (
            <Link
              href={`/admin/customers/${order.customerId}`}
              className="mt-5 inline-block text-sm text-[#2b337d] hover:underline"
            >
              View customer profile →
            </Link>
          )}
        </div>

        {/* payment */}
        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <h2 className="font-semibold">Payment</h2>
          <dl className="mt-4 space-y-4 text-sm">
            {order.item && (
              <div>
                <dt className="text-[#6b7194]">Item</dt>
                <dd className="mt-1 font-medium">{order.item}</dd>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#6b7194]">
                  Discount {order.couponCode && <span className="font-mono text-xs">({order.couponCode})</span>}
                </dt>
                <dd className="text-emerald-700">−₹{(order.discount / 100).toLocaleString("en-IN")}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[#6b7194]">Amount {order.discount > 0 && "paid"}</dt>
              <dd className="font-semibold">₹{(order.amount / 100).toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#6b7194]">Placed</dt>
              <dd>{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</dd>
            </div>
            {order.paidAt && (
              <div className="flex justify-between">
                <dt className="text-[#6b7194]">Paid</dt>
                <dd>{new Date(order.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</dd>
              </div>
            )}
            {order.paymentId && (
              <div>
                <dt className="text-[#6b7194]">Razorpay payment</dt>
                <dd className="mt-1 font-mono text-xs">{order.paymentId}</dd>
              </div>
            )}
            {orderRefunds.map((r) => (
              <div
                key={r.id}
                className={`rounded-xl px-4 py-3 ${r.status === "failed" ? "bg-red-50" : "bg-purple-50"}`}
              >
                <dt className={r.status === "failed" ? "text-red-700" : "text-purple-900/70"}>
                  Refund · {r.status}
                </dt>
                <dd className={`mt-1 font-medium ${r.status === "failed" ? "text-red-700" : "text-purple-900"}`}>
                  ₹{(r.amount / 100).toLocaleString("en-IN")}
                  <span className="block font-mono text-xs font-normal">{r.id}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* fulfilment actions */}
      {order.status === "paid" && <ShipForm orderId={order.id} />}

      {order.status === "shipped" && <DeliverForm orderId={order.id} />}

      {["created", "failed"].includes(order.status) && <CancelForm orderId={order.id} />}

      {order.customer.email && <EmailButtons orderId={order.id} status={order.status} />}

      {user?.role === "owner" &&
        ["paid", "shipped", "delivered"].includes(order.status) &&
        (order.source === "manual" ? (
          <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6 text-sm text-[#6b7194]">
            <h2 className="font-semibold text-[#1c2030]">Refund</h2>
            <p className="mt-2 leading-relaxed">
              This is a manual sale ({order.paymentMethod ?? "offline"}). Razorpay refunds don&apos;t apply —
              settle the refund offline and add a note for the record.
            </p>
          </div>
        ) : (
          <RefundForm orderId={order.id} amount={order.amount} />
        ))}

      {/* activity */}
      <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
        <h2 className="font-semibold">Activity</h2>
        <ol className="mt-4 space-y-3 text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-4 border-b border-[#eef0f7] pb-3 last:border-0 last:pb-0">
              <div>
                <span className="font-medium">{eventLabels[e.type] ?? e.type}</span>
                {e.note && <span className="block text-[#6b7194]">{e.note}</span>}
                <span className="block text-xs text-[#9aa0c3]">by {e.actor}</span>
              </div>
              <span className="whitespace-nowrap text-xs text-[#9aa0c3]">
                {new Date(e.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </li>
          ))}
        </ol>

        <form action={addNoteAction} className="mt-5 flex gap-3">
          <input type="hidden" name="id" value={order.id} />
          <input
            name="note"
            required
            placeholder="Add an internal note…"
            className="flex-1 rounded-xl border border-[#dcdfee] px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]"
          />
          <button
            type="submit"
            className="rounded-xl border border-[#dcdfee] px-5 py-2.5 text-sm font-semibold text-[#4a5072] hover:border-[#2b337d]/40"
          >
            Add note
          </button>
        </form>
      </div>
    </div>
  );
}
