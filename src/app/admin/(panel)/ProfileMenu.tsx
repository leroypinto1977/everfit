"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, LogOutIcon } from "@/components/admin/icons";

type User = { name: string; email: string; role: string };

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfileMenu({
  user,
  logoutAction,
}: {
  user: User;
  logoutAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2.5 rounded-xl border py-1 pl-1 pr-2.5 transition-colors ${
          open ? "border-[#2b337d]/30 bg-[#eef0f8]" : "border-[#e3e5f0] bg-white hover:bg-[#f3f4fa]"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2b337d] text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden text-sm font-medium text-[#1c2030] sm:block">{user.name}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-[#8a90b0] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[#e3e5f0] bg-white shadow-lg shadow-[#1c2030]/5"
        >
          <div className="border-b border-[#eef0f7] px-4 py-3">
            <p className="text-sm font-semibold text-[#1c2030]">{user.name}</p>
            <p className="truncate text-xs text-[#9aa0c3]">{user.email}</p>
            <span className="mt-2 inline-block rounded-full bg-[#eef0f8] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#2b337d]">
              {user.role}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOutIcon className="h-[18px] w-[18px]" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
