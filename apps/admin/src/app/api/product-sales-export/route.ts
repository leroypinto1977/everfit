import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getProductSales, toCsv } from "@everfit/core/lib/revenue";
import { istAddDays, istParseInput } from "@everfit/core/lib/report-time";

/** Owner-only CSV of units sold per variant, matching the /product-sales screen. */
export async function GET(req: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  // IST calendar days, so the file agrees with the IST-bucketed screen.
  const from = istParseInput(fromStr);
  const to = istParseInput(toStr);
  if (!from || !to) {
    return NextResponse.json({ error: "from and to dates are required (YYYY-MM-DD)" }, { status: 400 });
  }
  if (from.getTime() > to.getTime()) {
    return NextResponse.json({ error: "from must be on or before to" }, { status: 400 });
  }

  try {
    const rows = await getProductSales(from, istAddDays(to, 1));
    const csv = toCsv(
      rows.map((r) => ({
        variant: r.weight ? (r.label ? `${r.weight} · ${r.label}` : r.weight) : `${r.key} (retired)`,
        product: r.product ?? "",
        sku: r.sku ?? "",
        units: r.units,
        orders: r.orders,
        // rupees, so the file opens straight into a spreadsheet
        revenue: (r.revenue / 100).toFixed(2),
        avg_unit_price: r.units > 0 ? (r.revenue / r.units / 100).toFixed(2) : "",
        refunded_units: r.refundedUnits,
        cost_of_goods: (r.cogs / 100).toFixed(2),
        uncosted_units: r.uncostedUnits,
      })),
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evherfit-products-sold-${fromStr}-to-${toStr}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Product sales export failed", err);
    return NextResponse.json({ error: "Export failed. Please try again." }, { status: 500 });
  }
}
