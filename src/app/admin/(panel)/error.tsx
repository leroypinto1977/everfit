"use client";

import { useEffect } from "react";

/** Error boundary for the admin panel — keeps the shell, shows a friendly retry. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-[#e3e5f0] bg-white px-8 py-10 text-center shadow-sm">
        <h1 className="font-display text-2xl font-bold italic text-[#1c2030]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[#6b7194]">
          This page hit an unexpected error. You can retry, or head back to the dashboard.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-[#9aa0c3]">Ref: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-[#2b337d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68]"
          >
            Try again
          </button>
          <a
            href="/admin"
            className="rounded-xl border border-[#dcdfee] bg-white px-5 py-2.5 text-sm font-semibold text-[#4a5072] transition-colors hover:border-[#2b337d]/40"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
