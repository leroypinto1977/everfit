import type { Metadata } from "next";
import { Exo_2, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Brand faces, kept so the sign-in screen still reads as EVHERFIT:
// Renoric (slanted display) ≈ Exo 2 italic, URW Geometric (body) ≈ Poppins.
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

// The dashboard itself uses a clean, neutral UI face (Inter) — see .admin-ui.
// Self-hosted (Google's latin variable file, OFL): on Hostinger's build server
// Google Fonts started answering Inter with a URL next/font can't parse, which
// failed every admin build. Exo 2 and Poppins still load from Google, as in the store.
const admin = localFont({
  src: "./fonts/inter-latin-wght.woff2",
  variable: "--font-admin",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EVHERFIT Admin",
    template: "%s — EVHERFIT Admin",
  },
  // Private tooling: never index, never follow, never show a snippet.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${admin.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
