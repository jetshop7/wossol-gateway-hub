import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { LogOut, PackageSearch } from "lucide-react";

import { Logo } from "@/components/Logo";
import { getClientAreaIdentity, getCurrentActor, logout } from "@/lib/api/auth.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/client/")({
  loader: async () => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "CLIENT") throw redirect({ to: "/client/login" });
    return getClientAreaIdentity();
  },
  component: ClientArea,
});

function ClientArea() {
  const identity = Route.useLoaderData();
  const router = useRouter();
  const signOut = async () => {
    await logout({ headers: { "x-wossol-csrf": readCsrfToken() ?? "" } });
    await router.navigate({ to: "/client/login" });
    await router.invalidate();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo imageClassName="h-10" />
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{identity.clientAccountName}</p>
              <p className="text-xs text-slate-500">{identity.userDisplayName}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
          Client workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Welcome, {identity.userDisplayName}
        </h1>
        <p className="mt-2 text-slate-600">Signed in to {identity.clientAccountName}.</p>
        <section className="mt-8 rounded-xl border bg-white p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-[#102c50]">
            <PackageSearch className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Your private catalog is coming next</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Your secure client workspace is ready. The private catalog experience will be introduced
            in a future update.
          </p>
        </section>
      </main>
    </div>
  );
}
