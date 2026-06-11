import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { saveOrder } from "@/lib/orders";

const PRICE_PAISE = 2999 * 100; // ₹2,999 — server-side source of truth

export async function POST(req: Request) {
  const { name, email, phone, address, city, state, pincode } = await req.json();

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

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  // Amount is fixed server-side so the client can never tamper with the price.
  const rzpOrder = await razorpay.orders.create({
    amount: PRICE_PAISE,
    currency: "INR",
    notes: { product: "EVERFIT Pulse", customer_name: name, customer_phone: phone },
  });

  await saveOrder({
    id: rzpOrder.id,
    status: "created",
    amount: PRICE_PAISE,
    currency: "INR",
    customer: { name, email, phone, address, city, state, pincode },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    orderId: rzpOrder.id,
    amount: PRICE_PAISE,
    currency: "INR",
    keyId,
  });
}
