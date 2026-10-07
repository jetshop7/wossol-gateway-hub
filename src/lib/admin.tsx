import { Link } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { logout } from "@/lib/api/auth.functions";
import { Logo } from "@/components/Logo";
import { readCsrfToken } from "@/lib/admin-csrf";

export function AdminShell({
  actor,
  children,
}: {
  actor: { actorType: string; userId: string; role?: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout({ headers: { "x-wossol-csrf": readCsrfToken() ?? "" } });
      window.location.assign("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Logo imageClassName="h-10 md:h-11" />
            <span className="hidden border-l border-slate-200 pl-4 text-sm font-semibold text-slate-500 sm:inline">
              Admin workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">Wossol operator</p>
              <p className="text-xs uppercase tracking-[0.14em] text-amber-600">
                {actor.role?.replace("CATALOG_", "") ?? "INTERNAL"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-amber-400 hover:text-slate-950 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{loggingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside
          className={`${open ? "fixed inset-y-16 left-0 z-30 block w-72" : "hidden"} border-r border-slate-200 bg-white lg:static lg:block lg:min-h-[calc(100vh-4rem)] lg:w-64 lg:shrink-0`}
        >
          <nav className="space-y-1 p-4" aria-label="Admin navigation">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Catalog
            </p>
            <NavItem
              to="/admin/catalog/companies"
              icon={<Users className="h-4 w-4" />}
              label="Companies & brands"
              onClick={() => setOpen(false)}
            />
            {actor.role === "CATALOG_ADMIN" && (
              <>
                <NavItem
                  to="/admin/catalog/clients"
                  icon={<Users className="h-4 w-4" />}
                  label="Client accounts"
                  onClick={() => setOpen(false)}
                />
                <NavItem
                  to="/admin/catalog/price-profiles"
                  icon={<BadgeDollarSign className="h-4 w-4" />}
                  label="Price Profiles"
                  onClick={() => setOpen(false)}
                />
              </>
            )}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Coming later
              </p>
              <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400">
                <Package className="h-4 w-4" /> Products
              </span>
              <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400">
                <ShieldCheck className="h-4 w-4" /> Publishing
              </span>
              <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400">
                <Settings className="h-4 w-4" /> Settings
              </span>
            </div>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  onClick,
}: {
  to: "/admin/catalog/companies" | "/admin/catalog/clients" | "/admin/catalog/price-profiles";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
      activeProps={{
        className:
          "flex items-center gap-3 rounded-md bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-950",
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
