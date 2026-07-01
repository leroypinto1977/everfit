import Link from "next/link";
import { requireOwner } from "@/lib/admin-auth";
import { listVariantsAdmin } from "@/lib/catalog";
import ManualSaleForm from "./ManualSaleForm";

export const dynamic = "force-dynamic";

export default async function NewManualSalePage() {
  await requireOwner();
  const variants = (await listVariantsAdmin()).filter((v) => v.active);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#9aa0c3]">
          <Link href="/admin/orders" className="hover:text-[#2b337d]">
            Orders
          </Link>{" "}
          · Manual sale
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold italic">Record a manual sale</h1>
        <p className="mt-1 text-sm text-[#6b7194]">
          Offline, cash or in-person sales. Counts toward revenue and reduces stock — just like an online order.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-[#e3e5f0] bg-white p-6">
        <ManualSaleForm
          variants={variants.map((v) => ({ key: v.key, label: v.label, weight: v.weight, price: v.price }))}
        />
      </div>
    </div>
  );
}
