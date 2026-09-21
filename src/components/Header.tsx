import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const links = [{ to: "/", label: "Home" }, { to: "/privacy-policy", label: "Privacy" }, { to: "/data-requests", label: "Data requests" }] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur"><div className="container-page flex h-16 items-center justify-between gap-4"><Link to="/" onClick={() => setOpen(false)} aria-label="Wossol Platform home"><Logo /></Link><nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation"><a href="/#capabilities" className="text-sm font-medium text-foreground/75 transition-colors hover:text-navy">Capabilities</a>{links.slice(1).map((link) => <Link key={link.to} to={link.to} className="text-sm font-medium text-foreground/75 transition-colors hover:text-navy">{link.label}</Link>)}</nav><button className="grid h-10 w-10 place-items-center rounded-md text-navy md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>{open && <nav className="border-t border-border bg-background px-5 py-3 md:hidden" aria-label="Mobile navigation"><a href="/#capabilities" onClick={() => setOpen(false)} className="block rounded-md px-2 py-3 text-sm font-medium text-foreground/80 hover:bg-secondary">Capabilities</a>{links.map((link) => <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="block rounded-md px-2 py-3 text-sm font-medium text-foreground/80 hover:bg-secondary">{link.label}</Link>)}</nav>}</header>;
}
