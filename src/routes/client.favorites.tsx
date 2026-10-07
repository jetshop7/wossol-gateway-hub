import { useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Heart, LogOut, PackageSearch } from "lucide-react";

import { ClientCatalogProductCard } from "@/components/ClientCatalogProductCard";
import { Logo } from "@/components/Logo";
import type { ClientCatalogProductDto } from "@/lib/client-catalog-types";
import {
  getClientAreaIdentity,
  getClientCatalogFavoritesFn,
  getCurrentActor,
  logout,
  setClientCatalogFavoriteFn,
} from "@/lib/api/auth.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/client/favorites")({
  loader: async () => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "CLIENT") throw redirect({ to: "/sign-in" });
    const [identity, favorites] = await Promise.all([
      getClientAreaIdentity(),
      getClientCatalogFavoritesFn({ data: { skip: 0 } }),
    ]);
    return { identity, favorites };
  },
  component: ClientFavoritesPage,
});

function ClientFavoritesPage() {
  const { identity, favorites: initialFavorites } = Route.useLoaderData();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [favoriteBusy, setFavoriteBusy] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  const removeFavorite = async (product: ClientCatalogProductDto) => {
    if (favoriteBusy) return;
    setFavoriteBusy(product.reference);
    try {
      await setClientCatalogFavoriteFn({
        data: { productReference: product.reference, isFavorite: false },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      setFavorites((current) => ({
        ...current,
        products: current.products.filter((item) => item.reference !== product.reference),
      }));
    } finally {
      setFavoriteBusy(null);
    }
  };

  const signOut = async () => {
    await logout({ headers: { "x-wossol-csrf": readCsrfToken() ?? "" } });
    await router.navigate({ to: "/sign-in" });
    await router.invalidate();
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Logo imageClassName="h-10" />
          <nav className="flex items-center gap-2 text-sm">
            <a
              href="/client"
              className="rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Catalog
            </a>
            <a
              href="/client/favorites"
              aria-current="page"
              className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-[#102c50]"
            >
              Favorites
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{identity.clientAccountName}</p>
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
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#0b2342] via-[#123860] to-[#1d5077] p-8 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            Your shortlist
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold">
            <Heart className="h-7 w-7 fill-rose-300 text-rose-300" /> Saved products
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            Products you save are available here while they remain in your authorized catalog.
          </p>
        </section>
        {!favorites.accessEnabled ? (
          <p className="mt-8 rounded-2xl border bg-white p-8 text-center text-sm text-slate-600">
            Catalog access is not enabled for this account.
          </p>
        ) : favorites.products.length ? (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.products.map((product) => (
              <ClientCatalogProductCard
                key={product.reference}
                product={product}
                favoriteBusy={favoriteBusy === product.reference}
                onToggleFavorite={(item) => void removeFavorite(item)}
              />
            ))}
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <PackageSearch className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-3 text-lg font-semibold text-[#102c50]">No saved products yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use the heart on a product card to add products to your shortlist.
            </p>
            <a
              href="/client"
              className="mt-5 inline-flex rounded-lg bg-[#102c50] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Browse catalog
            </a>
          </section>
        )}
        {favorites.hasMore && (
          <div className="mt-7 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={async () => {
                setLoadingMore(true);
                try {
                  const next = await getClientCatalogFavoritesFn({
                    data: { skip: favorites.products.length },
                  });
                  setFavorites((current) => ({
                    ...next,
                    products: [...current.products, ...next.products],
                  }));
                } finally {
                  setLoadingMore(false);
                }
              }}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102c50] disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more favorites"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
