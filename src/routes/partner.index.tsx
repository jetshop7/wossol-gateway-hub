import { useEffect, useRef, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PackageSearch, Search } from "lucide-react";

import { ClientCatalogProductCard } from "@/components/ClientCatalogProductCard";
import { PartnerWorkspaceHeader } from "@/components/PartnerWorkspaceHeader";
import { getCurrentActor } from "@/lib/api/auth.functions";
import {
  getPartnerCatalogFn,
  getPartnerWorkspaceIdentityFn,
  setPartnerCatalogFavoriteFn,
} from "@/lib/api/partner.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/partner/")({
  loader: async () => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "PARTNER") throw redirect({ to: "/sign-in" });
    const [identity, catalog] = await Promise.all([
      getPartnerWorkspaceIdentityFn(),
      getPartnerCatalogFn({ data: { skip: 0 } }),
    ]);
    return { identity, catalog };
  },
  component: PartnerCatalogPage,
});

function PartnerCatalogPage() {
  const { identity, catalog: initialCatalog } = Route.useLoaderData();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const current = ++requestId.current;
    const timer = window.setTimeout(
      () => {
        setLoading(true);
        setError(false);
        void getPartnerCatalogFn({ data: { search: query.trim() || undefined, skip: 0 } })
          .then((next) => {
            if (current === requestId.current) setCatalog(next);
          })
          .catch(() => {
            if (current === requestId.current) setError(true);
          })
          .finally(() => {
            if (current === requestId.current) setLoading(false);
          });
      },
      query ? 250 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  const toggleFavorite = async (product: (typeof catalog.products)[number]) => {
    setFavoriteBusy(product.reference);
    try {
      const next = !product.isFavorite;
      await setPartnerCatalogFavoriteFn({
        data: { productReference: product.reference, isFavorite: next },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      setCatalog((current) => ({
        ...current,
        products: current.products.map((item) =>
          item.reference === product.reference ? { ...item, isFavorite: next } : item,
        ),
      }));
    } finally {
      setFavoriteBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <PartnerWorkspaceHeader identity={identity} current="catalog" />
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#0b2342] via-[#123860] to-[#1d5077] p-8 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            Partner workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Authorized product catalog</h1>
          <p className="mt-2 text-sm text-blue-100">
            Products and Partner resale prices available to your account.
          </p>
        </section>
        <label className="mt-7 flex max-w-xl items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search authorized products"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        {loading && <p className="mt-5 text-sm text-slate-500">Updating catalog…</p>}
        {error ? (
          <p
            role="alert"
            className="mt-7 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            The catalog could not be loaded. Please try again.
          </p>
        ) : catalog.products.length ? (
          <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.products.map((product) => (
              <ClientCatalogProductCard
                key={product.reference}
                product={product}
                workspaceBase="/partner"
                favoriteBusy={favoriteBusy === product.reference}
                onToggleFavorite={(item) => void toggleFavorite(item)}
              />
            ))}
          </section>
        ) : (
          <section className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <PackageSearch className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-3 text-lg font-semibold text-[#102c50]">No products available</h2>
            <p className="mt-1 text-sm text-slate-500">
              Products appear here when they are published and authorized for your account.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
