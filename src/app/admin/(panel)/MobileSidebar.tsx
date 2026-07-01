"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { MenuIcon, CloseIcon } from "@/components/admin/icons";
import Sidebar from "./Sidebar";

/** Hamburger + off-canvas drawer for the admin sidebar on < lg screens. */
export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false); // close on navigation
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4a5072] transition-colors hover:bg-[#eef0f8] lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-[#1c2030]/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.26, ease: [0.21, 0.65, 0.36, 1] }}
              className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col bg-white shadow-2xl"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-[#8a90b0] transition-colors hover:bg-[#eef0f8]"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
