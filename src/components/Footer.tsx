export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
        <p className="font-display text-lg font-bold">
          EVER<span className="text-accent">FIT</span>
        </p>
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} Everfit. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-muted">
          <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
          <a href="#" className="transition-colors hover:text-foreground">Terms</a>
          <a href="#" className="transition-colors hover:text-foreground">Support</a>
        </div>
      </div>
    </footer>
  );
}
