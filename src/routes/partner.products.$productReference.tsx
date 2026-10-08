import { useState } from "react";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { ClientCatalogProductDetail } from "@/components/ClientCatalogProductDetail";
import { PartnerWorkspaceHeader } from "@/components/PartnerWorkspaceHeader";
import { readCsrfToken } from "@/lib/admin-csrf";
import { getCurrentActor } from "@/lib/api/auth.functions";
import {
  getPartnerCatalogProductFn,
  getPartnerWorkspaceIdentityFn,
  setPartnerCatalogFavoriteFn,
} from "@/lib/api/partner.functions";
import type { ClientCatalogProductDto } from "@/lib/client-catalog-types";

export const Route = createFileRoute("/partner/products/$productReference")({
  loader: async ({ params }) => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "PARTNER") throw redirect({ to: "/sign-in" });
    const [identity, result] = await Promise.all([
      getPartnerWorkspaceIdentityFn(),
      getPartnerCatalogProductFn({ data: { productReference: params.productReference } }),
    ]);
    if (!result.product) throw notFound();
    return { identity, product: result.product };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl p-10 text-center">
      <h1 className="text-2xl font-semibold text-[#102c50]">Product not available</h1>
      <p className="mt-2 text-sm text-slate-600">This product is not available in your catalog.</p>
      <a href="/partner" className="mt-5 inline-block font-semibold text-[#17436a]">
        Return to catalog
      </a>
    </main>
  ),
  component: PartnerProductPage,
});

function PartnerProductPage() {
  const { identity, product: initialProduct } = Route.useLoaderData();
  const [product, setProduct] = useState(initialProduct);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const toggleFavorite = async () => {
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      const result = await setPartnerCatalogFavoriteFn({
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
  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <PartnerWorkspaceHeader identity={identity} current="catalog" />
      <ClientCatalogProductDetail
        product={product}
        workspaceBase="/partner"
        onToggleFavorite={() => void toggleFavorite()}
        favoriteBusy={favoriteBusy}
      />
    </div>
  );
}
