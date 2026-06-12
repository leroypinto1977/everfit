import type { Metadata } from "next";
import { Exo_2, Poppins } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

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

export const metadata: Metadata = {
  title: "EVHERFIT — Be the woman",
  description:
    "The EVHERFIT Infinity Band: weighted resistance bands designed for her, built for life. Iron-sand core, silicone shell, sold as a pair — for walks, yoga and strength.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
