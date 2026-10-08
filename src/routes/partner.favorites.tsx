import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Heart, PackageSearch } from "lucide-react";

import { ClientCatalogProductCard } from "@/components/ClientCatalogProductCard";
import { PartnerWorkspaceHeader } from "@/components/PartnerWorkspaceHeader";
import { readCsrfToken } from "@/lib/admin-csrf";
import { getCurrentActor } from "@/lib/api/auth.functions";
import {
  getPartnerCatalogFavoritesFn,
  getPartnerWorkspaceIdentityFn,
  setPartnerCatalogFavoriteFn,
} from "@/lib/api/partner.functions";
import type { ClientCatalogProductDto } from "@/lib/client-catalog-types";

export const Route = createFileRoute("/partner/favorites")({
  loader: async () => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "PARTNER") throw redirect({ to: "/sign-in" });
    const [identity, favorites] = await Promise.all([
      getPartnerWorkspaceIdentityFn(),
      getPartnerCatalogFavoritesFn({ data: { skip: 0 } }),
    ]);
    return { identity, favorites };
  },
  component: PartnerFavoritesPage,
});

function PartnerFavoritesPage() {
  const { identity, favorites: initialFavorites } = Route.useLoaderData();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const removeFavorite = async (product: ClientCatalogProductDto) => {
    if (busy) return;
    setBusy(product.reference);
    try {
      await setPartnerCatalogFavoriteFn({
        data: { productReference: product.reference, isFavorite: false },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      setFavorites((current) => ({
        ...current,
        products: current.products.filter((item) => item.reference !== product.reference),
      }));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <PartnerWorkspaceHeader identity={identity} current="favorites" />
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#0b2342] via-[#123860] to-[#1d5077] p-8 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            Saved products
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold">
            <Heart className="h-7 w-7 fill-rose-300 text-rose-300" /> Favorites
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            Saved products that remain authorized for your account.
          </p>
        </section>
        {favorites.products.length ? (
          <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.products.map((product) => (
              <ClientCatalogProductCard
                key={product.reference}
                product={product}
                workspaceBase="/partner"
                favoriteBusy={busy === product.reference}
                onToggleFavorite={(item) => void removeFavorite(item)}
              />
            ))}
          </section>
        ) : (
          <section className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <PackageSearch className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-3 text-lg font-semibold text-[#102c50]">No saved products yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use the heart on an authorized product to save it.
            </p>
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
                  const next = await getPartnerCatalogFavoritesFn({
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
