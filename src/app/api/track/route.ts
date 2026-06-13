import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { courierName, trackingUrl } from "@/lib/couriers";

/**
 * Public order tracking. The caller must present the order ID *and* the
 * phone number used at checkout — the pair acts as a shared secret, so we
 * never leak order details to someone who only has the ID. The response is
 * sanitized: status timeline + courier number, city only (no full address).
 */
export async function POST(req: Request) {
  const { orderId, phone } = await req.json();
  if (!orderId || !phone) {
    return NextResponse.json({ error: "Order ID and phone are required" }, { status: 400 });
  }

  const order = await getOrder(String(orderId).trim());
  const digits = String(phone).replace(/\D/g, "");
  const orderDigits = order?.customer.phone.replace(/\D/g, "") ?? "";

  // compare the last 10 digits so "+91 98..." and "98..." both match
  if (!order || digits.length < 10 || !orderDigits.endsWith(digits.slice(-10))) {
    return NextResponse.json(
      { error: "No order found for that ID and phone combination." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    item: order.item ?? "EVHERFIT Infinity Band",
    city: order.customer.city,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? null,
    shippedAt: order.shippedAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    tracking: order.tracking ?? null,
    courier: order.courier ? courierName(order.courier) : null,
    trackingUrl: trackingUrl(order.courier, order.tracking),
  });
}
