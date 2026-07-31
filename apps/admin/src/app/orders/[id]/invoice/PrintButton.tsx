"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-[#2b337d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#232a68]"
    >
      Print / save PDF
    </button>
  );
}
