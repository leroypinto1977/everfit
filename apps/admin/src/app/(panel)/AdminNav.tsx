"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";
import {
  DashboardIcon,
  OrdersIcon,
  CustomersIcon,
  LeadsIcon,
  ProductsIcon,
  InventoryIcon,
  CouponsIcon,
  RevenueIcon,
  ProductSalesIcon,
  AnalyticsIcon,
  EmailsIcon,
  SettingsIcon,
  TeamIcon,
  CardIcon,
  ExternalIcon,
} from "@/components/icons";

import { canSee, SCREENS, type ScreenAccess, type ScreenKey } from "@/lib/screens";

type Icon = (p: SVGProps<SVGSVGElement>) => React.ReactElement;

const icons: Record<ScreenKey, Icon> = {
  dashboard: DashboardIcon,
  orders: OrdersIcon,
  customers: CustomersIcon,
  "one-to-one": LeadsIcon,
  products: ProductsIcon,
  inventory: InventoryIcon,
  coupons: CouponsIcon,
  revenue: RevenueIcon,
  "product-sales": ProductSalesIcon,
  analytics: AnalyticsIcon,
  emails: EmailsIcon,
};

export default function AdminNav({ access, onNavigate }: { access: ScreenAccess; onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Team is owner-only. Settings is always there: everyone can change their own password.
  const visible = [
    ...SCREENS.filter((s) => canSee(access, s.key)).map((s) => ({ ...s, icon: icons[s.key] })),
    ...(access.role === "owner" ? [{ href: "/team", label: "Team", icon: TeamIcon }] : []),
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {visible.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
