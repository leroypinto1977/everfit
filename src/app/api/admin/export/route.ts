import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getOrdersForExport, toCsv } from "@/lib/revenue";

/** Owner-only CSV export of orders (by created date) for accounting. */
export async function GET(req: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T00:00:00`);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "from and to dates are required (YYYY-MM-DD)" }, { status: 400 });
  }
  if (from.getTime() > to.getTime()) {
    return NextResponse.json({ error: "from must be on or before to" }, { status: 400 });
  }
  const toExclusive = new Date(to);
  toExclusive.setDate(toExclusive.getDate() + 1);

  try {
    const rows = await getOrdersForExport(from, toExclusive);
    const csv = toCsv(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evherfit-orders-${fromStr}-to-${toStr}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Order export failed", err);
    return NextResponse.json({ error: "Export failed. Please try again." }, { status: 500 });
  }
}
