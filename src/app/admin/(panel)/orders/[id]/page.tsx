import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import StatusBadge from "@/components/admin/StatusBadge";
import { markShipped, markDelivered } from "../actions";

export const dynamic = "force-dynamic";

export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const c = order.customer;

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-[#6b7194] hover:text-[#2b337d]">
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold italic">{c.name}</h1>
          <p className="mt-1 font-mono text-sm text-[#9aa0c3]">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
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
                <dt className="text-xs uppercase tracking-wider text-[#9aa0c3]">Tracking number</dt>
                <dd className="mt-1 font-mono">{order.tracking}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* payment */}
        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <h2 className="font-semibold">Payment</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#6b7194]">Amount</dt>
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
          </dl>
        </div>
      </div>

      {/* fulfilment actions */}
      {order.status === "paid" && (
        <form action={markShipped} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <input type="hidden" name="id" value={order.id} />
          <div className="flex-1 min-w-64">
            <label htmlFor="tracking" className="mb-2 block text-sm text-[#6b7194]">
              Courier tracking number (optional)
            </label>
            <input
              id="tracking"
              name="tracking"
              placeholder="e.g. DELHIVERY-1234567890"
              className="w-full rounded-xl border border-[#dcdfee] px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68]"
          >
            Mark as shipped
          </button>
        </form>
      )}

      {order.status === "shipped" && (
        <form action={markDelivered} className="mt-6 rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <input type="hidden" name="id" value={order.id} />
          <button
            type="submit"
            className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68]"
          >
            Mark as delivered
          </button>
        </form>
      )}
    </>
  );
}
