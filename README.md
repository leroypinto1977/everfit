# EVERFIT — Pulse fitness band

Product website for the EVERFIT Pulse fitness band. Next.js (App Router) + Tailwind v4 +
Motion (Framer Motion) + Lenis smooth scroll, with no-login guest checkout via Razorpay.

## Run it

```bash
cp .env.example .env.local   # fill in Razorpay test keys
npm install
npm run dev
```

## How orders work without a login (the Fittr model)

There are no user accounts. The checkout form collects everything we need, and Razorpay
tells us — server to server — when money actually moves:

1. **Customer fills the checkout form** (`/checkout`): name, email, phone, address.
   This replaces a login — identity is captured per order.
2. **`POST /api/checkout`** creates a Razorpay Order via their Orders API (price fixed
   server-side) and saves a `created` order with the shipping details.
3. **Razorpay's modal opens** in the browser — UPI / cards / netbanking / EMI.
4. **On success the browser calls `POST /api/verify`**, which checks the HMAC signature
   so a forged "success" can't mark an order paid. The customer sees `/success`.
5. **Razorpay also calls our webhook** (`POST /api/webhooks/razorpay`) with
   `payment.captured` / `payment.failed`. This is the *authoritative* signal — it fires
   even if the customer closes the tab mid-redirect, so no paid order is ever missed.
   This is also where to plug in confirmation emails / WhatsApp notifications.

### How the client tracks orders

- **`/admin/orders?key=<ADMIN_KEY>`** — order dashboard with customer, shipping address,
  payment status, and revenue total. This is what they fulfil/ship from.
- **Razorpay Dashboard** — every payment, settlement, and refund also shows up there
  (Razorpay emails them on each payment too, if enabled in dashboard settings).

### Razorpay setup checklist

1. Create account at dashboard.razorpay.com → complete KYC for live mode.
2. Settings → API Keys → generate **test** keys first (`rzp_test_…`) → `.env.local`.
3. After deploying, Settings → Webhooks → add
   `https://<domain>/api/webhooks/razorpay`, choose events `payment.captured` and
   `payment.failed`, set a secret, and put the same secret in `RAZORPAY_WEBHOOK_SECRET`.
4. Test with Razorpay's test UPI/card numbers, then swap to live keys.

### Before production

- **Swap the order store**: `src/lib/orders.ts` writes a local JSON file, which works in
  dev but does not persist on serverless hosting. Replace its three functions with a real
  database (Neon Postgres on the Vercel Marketplace is a one-click fit).
- **Add transactional email** (Resend is the easiest): order confirmation to the customer
  and a "new order" alert to the client, triggered from the webhook handler.
- **Replace the `ADMIN_KEY` query param** with real auth if the admin area grows.

## Where the animations live

| File | What it does |
| --- | --- |
| `src/components/SmoothScroll.tsx` | Lenis inertial smooth scrolling, site-wide |
| `src/components/SplitText.tsx` | Word-by-word masked headline reveal |
| `src/components/Magnetic.tsx` | Cursor-magnetic buttons (spring physics) |
| `src/components/Reveal.tsx` | Scroll-into-view fade/rise/unblur |
| `src/components/Hero.tsx` | Parallax on scroll, floating band, breathing glow |
| `src/components/Showcase.tsx` | Pinned scroll section — band screen swaps per panel |
| `src/components/Features.tsx` | 3D tilt-on-hover cards |
| `src/components/Stats.tsx` | Spring-animated count-up numbers |
| `src/components/BandVisual.tsx` | SVG band with animated ECG / sleep ring / SpO2 / battery screens |
| `src/app/globals.css` | Marquee, film grain, ECG dash, glow/float keyframes |

All scroll/hover animations respect `prefers-reduced-motion`.
