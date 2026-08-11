import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="absolute left-1/2 top-1/3 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-brand/10 blur-[140px]" />
      <p className="font-display text-6xl font-bold text-brand sm:text-7xl">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        This page took a rest day.
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-block rounded-full bg-brand px-8 py-4 font-display font-bold text-white transition hover:brightness-95"
        >
          Back to home
        </Link>
        <Link href="/product" className="text-sm text-brand underline-offset-2 hover:underline">
          Shop the Infinity Band →
        </Link>
      </div>
    </main>
  );
}
