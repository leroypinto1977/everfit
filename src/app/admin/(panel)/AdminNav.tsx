"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";
import {
  DashboardIcon,
  OrdersIcon,
  CustomersIcon,
  ProductsIcon,
  CouponsIcon,
  RevenueIcon,
  EmailsIcon,
  SettingsIcon,
  CardIcon,
  ExternalIcon,
} from "@/components/admin/icons";

type Item = {
  href: string;
  label: string;
  icon: (p: SVGProps<SVGSVGElement>) => React.ReactElement;
};

const items: Item[] = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/orders", label: "Orders", icon: OrdersIcon },
  { href: "/admin/customers", label: "Customers", icon: CustomersIcon },
  { href: "/admin/products", label: "Products", icon: ProductsIcon },
  { href: "/admin/coupons", label: "Coupons", icon: CouponsIcon },
  { href: "/admin/revenue", label: "Revenue", icon: RevenueIcon },
  { href: "/admin/emails", label: "Emails", icon: EmailsIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#2b337d] text-white"
                : "text-[#4a5072] hover:bg-[#eef0f8] hover:text-[#2b337d]"
            }`}
          >
            <Icon className={`h-[18px] w-[18px] ${active ? "" : "text-[#8a90b0]"}`} />
            {label}
          </Link>
        );
      })}

      <a
        href="https://dashboard.razorpay.com"
        target="_blank"
        rel="noreferrer"
        className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#4a5072] transition-colors hover:bg-[#eef0f8] hover:text-[#2b337d]"
      >
        <CardIcon className="h-[18px] w-[18px] text-[#8a90b0]" />
        Razorpay
        <ExternalIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
      </a>
    </nav>
  );
}
