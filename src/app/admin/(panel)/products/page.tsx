import { getAdminUser } from "@/lib/admin-auth";
import { getProductAdmin, listVariantsAdmin } from "@/lib/catalog";
import { updateProductAction, updateVariantAction } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-[#dcdfee] bg-white px-3 py-2 text-sm outline-none focus:border-[#2b337d] disabled:bg-[#f3f4fa] disabled:text-[#9aa0c3]";

export default async function ProductsPage() {
  const [product, variants, user] = await Promise.all([
    getProductAdmin(),
    listVariantsAdmin(),
    getAdminUser(),
  ]);
  const canEdit = user?.role === "owner";

  if (!product) {
    return <p className="text-sm text-[#6b7194]">No product found — run the database migration first.</p>;
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold italic">Products</h1>
      <p className="mt-1 text-sm text-[#6b7194]">
        Prices and stock go live on the storefront the moment you save.
        {!canEdit && " Editing is restricted to the owner account."}
      </p>

      {/* product */}
      <form
        action={updateProductAction}
        className="mt-8 flex flex-wrap items-end gap-4 rounded-2xl border border-[#e3e5f0] bg-white p-6"
      >
        <input type="hidden" name="id" value={product.id} />
        <div className="min-w-72 flex-1">
          <label htmlFor="pname" className="mb-2 block text-sm text-[#6b7194]">
            Product name
          </label>
          <input id="pname" name="name" defaultValue={product.name} disabled={!canEdit} className={inputCls} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-[#4a5072]">
          <input type="checkbox" name="active" defaultChecked={product.active} disabled={!canEdit} />
          Listed on storefront
        </label>
        {canEdit && (
          <button
            type="submit"
            className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#232a68]"
          >
            Save
          </button>
        )}
      </form>

      {/* variants */}
      <h2 className="mt-10 font-semibold">Variants</h2>
      <div className="mt-3 space-y-4">
        {variants.map((v) => (
          <form
            key={v.id}
            action={updateVariantAction}
            className="grid items-end gap-4 rounded-2xl border border-[#e3e5f0] bg-white p-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_repeat(3,8rem)_auto_auto]"
          >
            <input type="hidden" name="id" value={v.id} />
            <div>
              <p className="font-display text-lg font-bold text-[#2b337d]">
                {v.weight}
                {v.popular && (
                  <span className="ml-2 rounded-full bg-[#e23a78]/10 px-2 py-0.5 align-middle text-[0.6rem] font-bold uppercase tracking-wider text-[#e23a78]">
                    Popular
                  </span>
                )}
              </p>
              <p className="text-xs text-[#9aa0c3]">
                {v.label} · SKU {v.sku}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#6b7194]">Tagline</label>
              <input name="blurb" defaultValue={v.blurb} disabled={!canEdit} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#6b7194]">Price ₹</label>
              <input
                name="price"
                type="number"
                step="1"
                min="1"
                defaultValue={v.price / 100}
                disabled={!canEdit}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#6b7194]">MRP ₹</label>
              <input
                name="mrp"
                type="number"
                step="1"
                min="1"
                defaultValue={v.mrp / 100}
                disabled={!canEdit}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#6b7194]">Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={v.stock ?? ""}
                placeholder="∞"
                disabled={!canEdit}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-[#4a5072]">
              <input type="checkbox" name="active" defaultChecked={v.active} disabled={!canEdit} />
              Active
            </label>
            {canEdit && (
              <button
                type="submit"
                className="rounded-xl border border-[#dcdfee] px-5 py-2 text-sm font-semibold text-[#4a5072] hover:border-[#2b337d]/40"
              >
                Save
              </button>
            )}
          </form>
        ))}
      </div>

      <p className="mt-4 text-xs text-[#9aa0c3]">
        Stock left blank = not tracked (never sells out). Stock is reduced automatically when an order is
        paid and restored on refunds. Sold-out variants stay visible but can&apos;t be purchased.
      </p>
    </>
  );
}
