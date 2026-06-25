import Link from "next/link";
import { listOrders, type OrderStatus } from "@/lib/orders";
import OrdersTable from "./OrdersTable";

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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold italic">Orders</h1>
        <p className="mt-1 text-sm text-[#6b7194]">
          {total} order{total === 1 ? "" : "s"}
          {status || q ? " match" : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
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

      <OrdersTable orders={orders} />

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-[#6b7194]">
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
    </div>
  );
}
