import Navbar from "./Navbar";
import Footer from "./Footer";

/** Shared shell for legal/support pages — brand-book light layout. */
export default function InfoPage({
  kicker,
  title,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-36">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">{kicker}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-brand sm:text-5xl">{title}</h1>
        {updated && <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>}
        <div className="prose-brand mt-10 space-y-6 leading-relaxed text-foreground/80 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-brand [&_h2]:mt-10 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
          {children}
        </div>
      </div>
      <Footer />
    </main>
  );
}
