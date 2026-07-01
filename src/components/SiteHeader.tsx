"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

// Pages with their own header / no storefront chrome.
const HIDE = ["/admin", "/checkout", "/success"];

/**
 * Renders the persistent storefront navbar. Lives in the layout (inside the
 * Lenis provider) so it never unmounts while browsing — no re-animation when
 * moving between the home, product and story screens.
 */
export default function SiteHeader() {
  const pathname = usePathname() || "/";
  if (HIDE.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  return <Navbar />;
}
