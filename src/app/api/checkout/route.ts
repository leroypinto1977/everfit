import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { saveOrder } from "@/lib/orders";
import { getVariant, PRODUCT_NAME } from "@/lib/product";

export async function POST(req: Request) {
  const { name, email, phone, address, city, state, pincode, variant: variantKey } = await req.json();

  if (!name || !email || !phone || !address || !pincode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
      { status: 500 }
    );
  }

  // Price comes from the server-side variant map — the client only sends a key.
  const variant = getVariant(variantKey);
  const item = `${PRODUCT_NAME} — ${variant.weight} (${variant.label})`;

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const rzpOrder = await razorpay.orders.create({
    amount: variant.price,
    currency: "INR",
    notes: { product: item, customer_name: name, customer_phone: phone },
  });

  await saveOrder({
    id: rzpOrder.id,
    status: "created",
    amount: variant.price,
    currency: "INR",
    item,
    customer: { name, email, phone, address, city, state, pincode },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    orderId: rzpOrder.id,
    amount: variant.price,
    currency: "INR",
    keyId,
  });
}
