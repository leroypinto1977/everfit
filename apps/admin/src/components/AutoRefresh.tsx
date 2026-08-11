"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps a server-rendered admin page live: re-fetches its data every
 * `seconds` while the tab is visible, and immediately when the tab regains
 * focus. router.refresh() only re-runs the server components — client state
 * (search inputs, selections, open forms) is preserved — so a new paid order
 * or a webhook status change shows up without anyone hitting reload.
 */
export default function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (!document.hidden) router.refresh();
    };
    const id = setInterval(tick, seconds * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);

  return null;
}
