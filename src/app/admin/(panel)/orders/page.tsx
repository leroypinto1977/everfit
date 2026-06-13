import Link from "next/link";
import { listOrders, type OrderStatus } from "@/lib/orders";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const filters: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "To ship", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Pending payment", value: "created" },
  { label: "Refunded", value: "refunded" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Failed", value: "failed" },
];

function pageUrl(status: string, q: string, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = "", q = "", page: pageParam = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const { orders, total } = await listOrders({
    status: status as OrderStatus | "",
    q,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <h1 className="font-display text-3xl font-bold italic">Orders</h1>
      <p className="mt-1 text-sm text-[#6b7194]">
        {total} order{total === 1 ? "" : "s"}
        {status || q ? " match" : ""}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={pageUrl(f.value, q, 1)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                status === f.value
                  ? "border-[#2b337d] bg-[#2b337d] text-white"
                  : "border-[#dcdfee] bg-white text-[#4a5072] hover:border-[#2b337d]/40"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, order ID…"
            className="w-72 rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d]"
          />
        </form>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Ship to</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-[#9aa0c3]">
                  No orders match.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[#eef0f7] transition-colors last:border-0 hover:bg-[#f8f9fd]">
                <td className="px-6 py-4">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-[#2b337d] hover:underline">
                    {o.customer.name}
                  </Link>
                  <span className="block font-mono text-xs text-[#9aa0c3]">{o.id}</span>
                </td>
                <td className="px-6 py-4 text-[#6b7194]">
                  {o.customer.phone}
                  <span className="block text-xs">{o.customer.email}</span>
                </td>
                <td className="max-w-52 px-6 py-4 text-[#6b7194]">
                  {o.customer.city}, {o.customer.state} {o.customer.pincode}
                </td>
                <td className="px-6 py-4 font-medium">
                  ₹{(o.amount / 100).toLocaleString("en-IN")}
                  {o.item && (
                    <span className="block text-xs font-normal text-[#9aa0c3]">
                      {o.item.replace("EVHERFIT Infinity Band — ", "")}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-6 py-4 text-xs text-[#9aa0c3]">
                  {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-[#6b7194]">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(status, q, page - 1)}
                className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 hover:border-[#2b337d]/40"
              >
                ← Newer
              </Link>
            )}
            {page < pages && (
              <Link
                href={pageUrl(status, q, page + 1)}
                className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 hover:border-[#2b337d]/40"
              >
                Older →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
