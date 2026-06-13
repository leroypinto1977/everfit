import { requireOwner } from "@/lib/admin-auth";
import { listCoupons } from "@/lib/coupons";
import { inr } from "@/lib/product";
import { toggleCouponAction } from "./actions";
import CouponForm from "./CouponForm";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  await requireOwner();
  const coupons = await listCoupons();
  const now = new Date().getTime();

  return (
    <>
      <h1 className="font-display text-3xl font-bold italic">Coupons</h1>
      <p className="mt-1 text-sm text-[#6b7194]">
        Discount codes redeemable at checkout. Usage counts only when an order is paid.
      </p>

      <div className="mt-8 rounded-2xl border border-[#e3e5f0] bg-white p-6">
        <h2 className="font-semibold">Create a code</h2>
        <CouponForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Conditions</th>
              <th className="px-6 py-4">Used</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-[#9aa0c3]">
                  No codes yet — create one above.
                </td>
              </tr>
            )}
            {coupons.map((c) => {
              const expired = c.expiresAt && c.expiresAt.getTime() < now;
              const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
              return (
                <tr key={c.id} className="border-b border-[#eef0f7] last:border-0">
                  <td className="px-6 py-4 font-mono font-medium">{c.code}</td>
                  <td className="px-6 py-4">
                    {c.type === "percent" ? `${c.value}% off` : `${inr(c.value)} off`}
                  </td>
                  <td className="px-6 py-4 text-[#6b7194]">
                    {c.minAmount ? `Min ${inr(c.minAmount)}` : "No minimum"}
                    {c.expiresAt && (
                      <span className={`block text-xs ${expired ? "text-red-500" : ""}`}>
                        {expired ? "Expired " : "Expires "}
                        {c.expiresAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {c.usedCount}
                    {c.maxUses !== null && ` / ${c.maxUses}`}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        c.active && !expired && !exhausted
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {!c.active ? "disabled" : expired ? "expired" : exhausted ? "used up" : "active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form action={toggleCouponAction} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="active" value={String(!c.active)} />
                      <button
                        type="submit"
                        className={`text-xs underline-offset-2 hover:underline ${
                          c.active ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {c.active ? "disable" : "enable"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
