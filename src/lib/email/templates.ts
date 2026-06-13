import type { Order } from "@/lib/orders";
import { courierName, trackingUrl } from "@/lib/couriers";
import {
  brand,
  button,
  heading,
  inr,
  mono,
  panel,
  paragraph,
  row,
  shell,
  siteUrl,
  summary,
} from "./render";

/**
 * Each template returns { subject, html }. Templates are pure — all sending,
 * env checks and error handling live in notify.ts.
 */
export interface Email {
  subject: string;
  html: string;
}

function shipTo(o: Order) {
  const c = o.customer;
  return `${c.address}, ${c.city}, ${c.state} — ${c.pincode}`;
}

function orderSummary(o: Order) {
  const subtotal = o.amount + o.discount;
  return summary(
    [
      row("Item", o.item ?? "EVHERFIT Infinity Band"),
      o.discount > 0 ? row("Subtotal", inr(subtotal)) : "",
      o.discount > 0
        ? row(`Discount${o.couponCode ? ` (${o.couponCode})` : ""}`, `−${inr(o.discount)}`, { color: brand.green })
        : "",
      row("Total", inr(o.amount), { strong: true, color: brand.indigo }),
    ].join("")
  );
}

/* ---------- customer ---------- */

export function orderConfirmation(o: Order): Email {
  return {
    subject: "Your EVHERFIT order is confirmed 🎉",
    html: shell(
      [
        heading("Order confirmed — be the woman."),
        paragraph(
          `Hi ${o.customer.name}, thank you for your order! Your EVHERFIT Infinity Band pair is being prepared and ships within 24 hours. We'll email tracking the moment it's on the way.`
        ),
        orderSummary(o),
        panel(
          `<strong style="color:${brand.ink}">Shipping to</strong><br>${shipTo(o)}<br><br>
           <strong style="color:${brand.ink}">Order ID</strong> ${mono(o.id)}`
        ),
        button("Track your order", siteUrl("/track")),
      ].join(""),
      { preheader: `Order confirmed — ${o.item ?? "EVHERFIT Infinity Band"}, ${inr(o.amount)}.` }
    ),
  };
}

export function orderShipped(o: Order): Email {
  const link = trackingUrl(o.courier, o.tracking);
  const via = o.courier ? ` via ${courierName(o.courier)}` : "";
  return {
    subject: "Your EVHERFIT order is on the way 📦",
    html: shell(
      [
        heading(`On its way${via}!`),
        paragraph(
          `Hi ${o.customer.name}, your ${o.item ?? "EVHERFIT Infinity Band"} just left our warehouse and is heading to you.`
        ),
        o.tracking
          ? panel(
              `<strong style="color:${brand.ink}">Tracking number</strong><br>${mono(o.tracking)}${
                o.courier ? ` &middot; ${courierName(o.courier)}` : ""
              }`
            )
          : "",
        link ? button("Track your package", link) : button("Track your order", siteUrl("/track")),
        paragraph(`Order ${mono(o.id)} · Shipping to ${o.customer.city}.`),
      ].join(""),
      { preheader: `Shipped${via} — track your EVHERFIT order.` }
    ),
  };
}

export function orderDelivered(o: Order): Email {
  return {
    subject: "Delivered — time to train 💪",
    html: shell(
      [
        heading("Your Infinity Band has arrived."),
        paragraph(
          `Hi ${o.customer.name}, order ${mono(o.id)} was delivered. Strap in for your next walk, flow or lift — strong is infinite.`
        ),
        panel(
          `Not quite right? You have <strong style="color:${brand.ink}">7 days</strong> for a no-questions return, plus a 1-year warranty. Just reply to this email.`,
          { bg: brand.pinkSoft }
        ),
        button("Shop accessories", siteUrl("/product")),
      ].join(""),
      { preheader: "Your EVHERFIT Infinity Band has been delivered." }
    ),
  };
}

export function refundInitiated(o: Order, amount: number): Email {
  return {
    subject: "Your EVHERFIT refund is on its way",
    html: shell(
      [
        heading("Refund initiated"),
        paragraph(
          `Hi ${o.customer.name}, we've initiated a refund for order ${mono(o.id)}. It typically reaches your account in 5–7 working days.`
        ),
        summary(row("Refund amount", inr(amount), { strong: true, color: brand.indigo })),
        paragraph(`If you don't see it after a week, reply to this email and we'll chase it for you.`),
      ].join(""),
      { preheader: `Refund of ${inr(amount)} initiated for order ${o.id}.` }
    ),
  };
}

export function paymentFailed(o: Order): Email {
  return {
    subject: "Your EVHERFIT order didn't go through — finish it here",
    html: shell(
      [
        heading("Almost there — let's complete your order"),
        paragraph(
          `Hi ${o.customer.name}, your payment for the ${o.item ?? "EVHERFIT Infinity Band"} didn't complete, so the order wasn't placed. No money was charged — and if your bank shows a hold, it's released automatically within 5–7 days.`
        ),
        paragraph(`Ready to try again? It only takes a minute.`),
        button("Complete your order", siteUrl("/product")),
        paragraph(`Hit a snag? Just reply to this email and we'll help you check out.`),
      ].join(""),
      { preheader: "Your payment didn't complete — finish your EVHERFIT order." }
    ),
  };
}

/* ---------- admin ---------- */

export function newOrderAdmin(o: Order): Email {
  const c = o.customer;
  return {
    subject: `New order ${inr(o.amount)} — ${c.name} (${c.city})`,
    html: shell(
      [
        heading("New order received"),
        summary(
          [
            row("Customer", c.name),
            row("Phone", c.phone),
            row("Email", c.email),
            row("Item", o.item ?? "EVHERFIT Infinity Band"),
            o.couponCode ? row("Coupon", `${o.couponCode} (−${inr(o.discount)})`, { color: brand.green }) : "",
            row("Total", inr(o.amount), { strong: true, color: brand.indigo }),
          ].join("")
        ),
        panel(`<strong style="color:${brand.ink}">Ship to</strong><br>${shipTo(o)}<br><br>
          Order ${mono(o.id)}<br>Payment ${mono(o.paymentId ?? "—")}`),
        button("Open in admin panel", siteUrl(`/admin/orders/${o.id}`)),
      ].join(""),
      { preheader: `${c.name} ordered ${o.item ?? "an Infinity Band"} — ${inr(o.amount)}.` }
    ),
  };
}

export function lowStockAdmin(items: { weight: string; sku: string; stock: number }[]): Email {
  return {
    subject: `⚠️ Low stock — ${items.map((i) => i.weight).join(", ")}`,
    html: shell(
      [
        heading("Low stock alert"),
        paragraph(`These variants are running low. Restock or mark them sold out before they run dry.`),
        summary(
          items
            .map((i) =>
              row(`${i.weight} · ${i.sku}`, `${i.stock} left`, {
                strong: true,
                color: i.stock <= 0 ? brand.pink : brand.ink,
              })
            )
            .join("")
        ),
        button("Manage products", siteUrl("/admin/products")),
      ].join(""),
      { preheader: `Low stock: ${items.map((i) => `${i.weight} (${i.stock})`).join(", ")}.`, headerBar: brand.indigoDeep }
    ),
  };
}

export function passwordReset(input: { name: string; resetUrl: string }): Email {
  return {
    subject: "Reset your EVHERFIT admin password",
    html: shell(
      [
        heading("Reset your password"),
        paragraph(
          `Hi ${input.name.split(" ")[0]}, we received a request to reset the password on your EVHERFIT admin account. Click below to choose a new one — the link is valid for 1 hour.`
        ),
        button("Reset my password", input.resetUrl),
        paragraph(
          `If you didn't request this, you can safely ignore this email — your password won't change until you open the link and set a new one.`
        ),
      ].join(""),
      { preheader: "Reset your EVHERFIT admin password (link valid for 1 hour).", headerBar: brand.indigoDeep }
    ),
  };
}

export function teammateWelcome(input: { name: string; email: string; role: string }): Email {
  return {
    subject: "You've been added to the EVHERFIT admin",
    html: shell(
      [
        heading(`Welcome to the team, ${input.name.split(" ")[0]}`),
        paragraph(
          `You've been added as <strong style="color:${brand.ink}">${input.role}</strong> on the EVHERFIT store admin. Sign in with this email — the owner will share your password separately.`
        ),
        panel(`<strong style="color:${brand.ink}">Your sign-in email</strong><br>${mono(input.email)}`),
        button("Go to admin sign-in", siteUrl("/admin/login")),
        paragraph(`For security, please change your password from <strong style="color:${brand.ink}">Settings</strong> right after your first sign-in.`),
      ].join(""),
      { preheader: "You've been given access to the EVHERFIT store admin.", headerBar: brand.indigoDeep }
    ),
  };
}
