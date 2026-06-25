import Link from "next/link";
import { requireAdmin, destroySession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { InfinityMark } from "@/components/Logo";
import { StoreIcon } from "@/components/admin/icons";
import AdminNav from "./AdminNav";
import ProfileMenu from "./ProfileMenu";

async function logout() {
  "use server";
  await destroySession();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="admin-ui flex h-screen overflow-hidden bg-[#f3f4fa] text-[#1c2030]">
      {/* sidebar — brand + navigation. The right border only runs below the
          brand row so the brand merges seamlessly into the top navbar. */}
      <aside className="flex h-full w-64 shrink-0 flex-col bg-white">
        <Link
          href="/admin"
          className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[#e3e5f0] px-6"
        >
          <InfinityMark className="h-5 text-[#2b337d]" />
          <span
            className="text-lg font-bold italic text-[#2b337d]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            EVHERFIT
          </span>
        </Link>

        <div className="flex min-h-0 flex-1 flex-col border-r border-[#e3e5f0]">
          <AdminNav />
        </div>
      </aside>

      {/* content column — top navbar + scrollable page */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[#e3e5f0] bg-white px-8">
          {/* left spacer keeps the centre item truly centred */}
          <div className="flex-1" />

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e3e5f0] px-4 py-2 text-sm font-medium text-[#4a5072] transition-colors hover:border-[#2b337d]/30 hover:bg-[#f3f4fa] hover:text-[#2b337d]"
          >
            <StoreIcon className="h-4 w-4" />
            View store
          </Link>

          <div className="flex flex-1 justify-end">
            <ProfileMenu user={user} logoutAction={logout} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
