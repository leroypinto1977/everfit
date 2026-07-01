import Link from "next/link";
import { InfinityMark } from "@/components/Logo";
import AdminNav from "./AdminNav";

/**
 * Sidebar contents (brand + nav) shared by the static desktop sidebar and the
 * mobile drawer. The right border only shows from `lg` up so on desktop the
 * brand row merges into the top navbar, while the drawer stays borderless.
 */
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Link
        href="/admin"
        onClick={onNavigate}
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

      <div className="flex min-h-0 flex-1 flex-col lg:border-r lg:border-[#e3e5f0]">
        <AdminNav onNavigate={onNavigate} />
      </div>
    </>
  );
}
