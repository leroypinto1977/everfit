/**
 * The admin panel's screens — the unit of access control. An owner sees every
 * screen; a staff member sees only the screens the owner ticked for them in
 * Settings → Team. Settings itself is always open (everyone can change their
 * own password); its team and store sections stay owner-only.
 *
 * No server imports: the sidebar (a client component) reads this list too.
 */
export const SCREENS = [
  { key: "dashboard", href: "/", label: "Dashboard" },
  { key: "orders", href: "/orders", label: "Orders" },
  { key: "customers", href: "/customers", label: "Customers" },
  { key: "one-to-one", href: "/one-to-one", label: "1-to-1" },
  { key: "products", href: "/products", label: "Products" },
  { key: "inventory", href: "/inventory", label: "Inventory" },
  { key: "coupons", href: "/coupons", label: "Coupons" },
  { key: "revenue", href: "/revenue", label: "Revenue" },
  { key: "product-sales", href: "/product-sales", label: "Products sold" },
  { key: "analytics", href: "/analytics", label: "Analytics" },
  { key: "emails", href: "/emails", label: "Emails" },
] as const;

export type ScreenKey = (typeof SCREENS)[number]["key"];

export const isScreenKey = (v: unknown): v is ScreenKey => SCREENS.some((s) => s.key === v);

/** What a new staff member starts with: the day-to-day screens, nothing financial. */
export const DEFAULT_STAFF_SCREENS: ScreenKey[] = ["dashboard", "orders", "customers", "one-to-one"];

export interface ScreenAccess {
  role: string;
  screens: readonly string[];
}

export const canSee = (user: ScreenAccess, key: ScreenKey) => user.role === "owner" || user.screens.includes(key);

/** Where to send someone who opened a screen they may not use: their first allowed screen. */
export const homeFor = (user: ScreenAccess) => SCREENS.find((s) => canSee(user, s.key))?.href ?? "/settings";
