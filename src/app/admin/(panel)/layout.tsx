import Link from "next/link";
import { requireAdmin, destroySession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { InfinityMark } from "@/components/Logo";

async function logout() {
  "use server";
  await destroySession();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen w-full bg-[#f3f4fa] text-[#1c2030]">
      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-[#e3e5f0] bg-white">
        <Link href="/admin" className="flex items-center gap-2.5 px-6 py-6">
          <InfinityMark className="h-5 text-[#2b337d]" />
          <span className="font-display text-lg font-bold italic text-[#2b337d]">EVHERFIT</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          <Link
            href="/admin"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#4a5072] transition-colors hover:bg-[#f3f4fa] hover:text-[#2b337d]"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#4a5072] transition-colors hover:bg-[#f3f4fa] hover:text-[#2b337d]"
          >
            📦 Orders
          </Link>
          <a
            href="https://dashboard.razorpay.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#4a5072] transition-colors hover:bg-[#f3f4fa] hover:text-[#2b337d]"
          >
            💳 Razorpay ↗
          </a>
        </nav>

        <div className="border-t border-[#e3e5f0] p-3">
          <Link
            href="/"
            className="block rounded-xl px-4 py-2.5 text-sm text-[#6b7194] transition-colors hover:bg-[#f3f4fa]"
          >
            ← View store
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-[#6b7194] transition-colors hover:bg-[#f3f4fa]"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="ml-60 flex-1 px-10 py-10">{children}</main>
    </div>
  );
}
