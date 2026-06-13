import type { OrderStatus } from "@/lib/orders";

const styles: Record<OrderStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  created: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-600 border-red-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-[#2b337d]/5 text-[#2b337d] border-[#2b337d]/20",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  refunded: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
