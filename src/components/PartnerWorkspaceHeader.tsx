import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { Logo } from "@/components/Logo";
import { readCsrfToken } from "@/lib/admin-csrf";
import { logout } from "@/lib/api/auth.functions";

export function PartnerWorkspaceHeader({
  identity,
  current,
}: {
  identity: { partnerName: string; userDisplayName: string };
  current: "catalog" | "favorites";
}) {
  const router = useRouter();
  const signOut = async () => {
    await logout({ headers: { "x-wossol-csrf": readCsrfToken() ?? "" } });
    await router.navigate({ to: "/sign-in" });
    await router.invalidate();
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Logo imageClassName="h-10" />
        <nav className="flex items-center gap-2 text-sm">
          <a
            href="/partner"
            aria-current={current === "catalog" ? "page" : undefined}
            className={`rounded-lg px-3 py-2 font-semibold ${current === "catalog" ? "bg-blue-50 text-[#102c50]" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Catalog
          </a>
          <a
            href="/partner/favorites"
            aria-current={current === "favorites" ? "page" : undefined}
            className={`rounded-lg px-3 py-2 font-semibold ${current === "favorites" ? "bg-blue-50 text-[#102c50]" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Favorites
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{identity.partnerName}</p>
            <p className="text-xs text-slate-500">{identity.userDisplayName}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
