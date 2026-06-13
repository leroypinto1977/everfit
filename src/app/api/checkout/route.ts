import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { saveOrder } from "@/lib/orders";
import { getPurchasableVariant } from "@/lib/catalog";

export async function POST(req: Request) {
  const { name, email, phone, address, city, state, pincode, variant: variantKey } = await req.json();

  if (!name || !email || !phone || !address || !pincode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Price and availability come from the DB-backed catalog — the client only sends a key.
  const variant = await getPurchasableVariant(variantKey);
  if (!variant) {
    return NextResponse.json({ error: "This product is currently unavailable." }, { status: 400 });
  }
  if (variant.soldOut) {
    return NextResponse.json(
      { error: `The ${variant.weight} option is sold out — please pick another weight.` },
      { status: 409 }
    );
  }

  const item = `${variant.productName} — ${variant.weight} (${variant.label})`;

  let rzpOrder;
  try {
    rzpOrder = await razorpay().orders.create({
      amount: variant.price,
      currency: "INR",
      notes: { product: item, customer_name: name, customer_phone: phone },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await saveOrder({
    id: rzpOrder.id,
    amount: variant.price,
    currency: "INR",
    item,
    variantKey: variant.key,
    customer: { name, email, phone, address, city: city ?? "", state: state ?? "", pincode },
  });

  return NextResponse.json({
    orderId: rzpOrder.id,
    amount: variant.price,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
