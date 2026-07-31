import type { Metadata } from "next";
import { Exo_2, Poppins } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/GTM";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, BRAND, SUPPORT_EMAIL } from "@everfit/core/lib/site";

// Brand faces: Renoric (slanted display) ≈ Exo 2 italic,
// URW Geometric (body) ≈ Poppins.
const display = Exo_2({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const body = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const DESCRIPTION =
  "EVHERFIT is women-centred fitness for lifelong strength. Shop the Infinity Band resistance band set with foam-grip handles, plus live coaching and programs built for her.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EVHERFIT — Resistance bands & women's fitness gear",
    template: "%s — EVHERFIT",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND,
    url: SITE_URL,
    title: "EVHERFIT — Resistance bands & women's fitness gear",
    description: DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVHERFIT — Resistance bands & women's fitness gear",
    description: DESCRIPTION,
  },
};

// Organisation + site-search-free WebSite schema, sitewide. Gives Google a
// stable brand entity (name, logo, contact, social) for the Knowledge Panel.
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  email: SUPPORT_EMAIL,
  description: DESCRIPTION,
  slogan: "Be the woman",
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND,
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">
        <JsonLd data={[orgSchema, webSiteSchema]} />
        <GoogleTagManagerNoScript />
        <GoogleTagManager />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
