import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getMovementsForExport } from "@/lib/inventory";
import { toCsv } from "@/lib/revenue";

/** Owner-only CSV export of the full inventory movement ledger. */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  try {
    const rows = await getMovementsForExport();
    const csv = toCsv(rows);
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evherfit-inventory-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Inventory export failed", err);
    return NextResponse.json({ error: "Export failed. Please try again." }, { status: 500 });
  }
}
