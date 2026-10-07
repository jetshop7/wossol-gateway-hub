import { useState } from "react";
import { createFileRoute, notFound, redirect, useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { ClientCatalogProductDetail } from "@/components/ClientCatalogProductDetail";
import { Logo } from "@/components/Logo";
import type { ClientCatalogProductDto } from "@/lib/client-catalog-types";
import {
  getClientAreaIdentity,
  getClientCatalogProductFn,
  getCurrentActor,
  logout,
  setClientCatalogFavoriteFn,
} from "@/lib/api/auth.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/client/products/$productReference")({
  loader: async ({ params }) => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "CLIENT") throw redirect({ to: "/sign-in" });
    const [identity, result] = await Promise.all([
      getClientAreaIdentity(),
      getClientCatalogProductFn({ data: { productReference: params.productReference } }),
    ]);
    if (!result.product) throw notFound();
    return { identity, product: result.product };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl p-10 text-center">
      <h1 className="text-2xl font-semibold text-[#102c50]">Product not available</h1>
      <p className="mt-2 text-sm text-slate-600">This product is not available in your catalog.</p>
      <a href="/client" className="mt-5 inline-block font-semibold text-[#17436a]">
        Return to catalog
      </a>
    </main>
  ),
  component: ClientProductPage,
});

function ClientProductPage() {
  const { identity, product: initialProduct } = Route.useLoaderData();
  const [product, setProduct] = useState(initialProduct);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const router = useRouter();

  const toggleFavorite = async () => {
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      const result = await setClientCatalogFavoriteFn({
        data: { productReference: product.reference, isFavorite: !product.isFavorite },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      setProduct((current: ClientCatalogProductDto) => ({
        ...current,
        isFavorite: result.isFavorite,
      }));
    } finally {
      setFavoriteBusy(false);
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
              className="rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50"
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
      <ClientCatalogProductDetail
        product={product}
        onToggleFavorite={() => void toggleFavorite()}
        favoriteBusy={favoriteBusy}
      />
    </div>
  );
}
