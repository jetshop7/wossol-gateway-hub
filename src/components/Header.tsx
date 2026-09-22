import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { to: "/platform", label: "Platform" },
  { to: "/integrations", label: "Integrations" },
  { to: "/security", label: "Security & Privacy" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" onClick={() => setOpen(false)} aria-label="Wossol Platform home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/platform"
          className="hidden rounded-md bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground transition-colors hover:bg-deep-navy lg:inline-flex"
        >
          Explore the platform
        </Link>
        <button
          className="grid h-10 w-10 place-items-center rounded-md text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav
          className="border-t border-border bg-background px-5 py-3 lg:hidden"
          aria-label="Mobile navigation"
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-3 text-sm font-medium text-foreground/80 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-gold"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/platform"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-md bg-navy px-3 py-3 text-sm font-semibold text-navy-foreground"
          >
            Explore the platform
          </Link>
        </nav>
      )}
    </header>
  );
}
