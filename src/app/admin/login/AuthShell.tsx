import { InfinityMark } from "@/components/Logo";

/** Two-panel auth layout shared by the sign-in, forgot and reset screens. */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-stretch bg-[#f3f4fa] text-[#1c2030]">
      <div className="relative hidden w-1/2 items-end overflow-hidden bg-[#2b337d] p-12 lg:flex">
        <InfinityMark className="absolute -right-32 top-1/4 w-[640px] text-white/10" draw />
        <div className="relative text-white">
          <div className="flex items-center gap-3">
            <InfinityMark className="h-7" />
            <span className="font-display text-3xl font-bold italic">EVHERFIT</span>
          </div>
          <p className="mt-3 text-sm uppercase tracking-[0.4em] text-white/60">Be the woman</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <InfinityMark className="h-5 text-[#2b337d]" />
            <span className="font-display text-xl font-bold italic text-[#2b337d]">EVHERFIT</span>
          </div>
          <h1 className="font-display text-3xl font-bold italic">{title}</h1>
          <p className="mt-2 text-sm text-[#6b7194]">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}

export const authInput =
  "w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-3.5 outline-none transition-all focus:border-[#2b337d] focus:ring-2 focus:ring-[#2b337d]/15";

export const authButton =
  "w-full rounded-xl bg-[#2b337d] py-3.5 font-semibold text-white transition-all hover:bg-[#232a68] active:scale-[0.99] disabled:opacity-60";
