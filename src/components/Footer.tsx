import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
        <span className="text-brand">
          <Logo tagline markClass="h-5 text-accent" />
        </span>
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} Evherfit. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-muted">
          <a href="#" className="transition-colors hover:text-brand">Privacy</a>
          <a href="#" className="transition-colors hover:text-brand">Terms</a>
          <a href="#" className="transition-colors hover:text-brand">Support</a>
        </div>
      </div>
    </footer>
  );
}
