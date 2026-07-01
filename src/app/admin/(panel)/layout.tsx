import Link from "next/link";
import { requireAdmin, destroySession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { StoreIcon } from "@/components/admin/icons";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
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
      {/* desktop sidebar — hidden on mobile, where it becomes a drawer */}
      <aside className="hidden w-64 shrink-0 flex-col bg-white lg:flex">
        <Sidebar />
      </aside>

      {/* content column — top navbar + scrollable page */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e3e5f0] bg-white px-4 sm:px-8">
          <MobileSidebar />
          {/* left spacer keeps the right cluster aligned */}
          <div className="flex-1" />

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e3e5f0] px-3 py-2 text-sm font-medium text-[#4a5072] transition-colors hover:border-[#2b337d]/30 hover:bg-[#f3f4fa] hover:text-[#2b337d] sm:px-4"
          >
            <StoreIcon className="h-4 w-4" />
            <span className="hidden sm:inline">View store</span>
          </Link>

          <ProfileMenu user={user} logoutAction={logout} />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
