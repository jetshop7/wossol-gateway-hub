import { useEffect, useRef, useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LogOut, PackageSearch, Search } from "lucide-react";

import { ClientCatalogProductCard } from "@/components/ClientCatalogProductCard";
import { Logo } from "@/components/Logo";
import type { ClientCatalogProductDto, ClientTaxonomyCategory } from "@/lib/client-catalog-types";
import {
  getClientAreaIdentity,
  getClientCatalogFavoritesFn,
  getClientCatalogFn,
  getClientTaxonomyCategoriesFn,
  getCurrentActor,
  logout,
  setClientCatalogFavoriteFn,
} from "@/lib/api/auth.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/client/")({
  loader: async () => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "CLIENT") throw redirect({ to: "/sign-in" });
    const [identity, catalog, categories] = await Promise.all([
      getClientAreaIdentity(),
      getClientCatalogFn({ data: {} }),
      getClientTaxonomyCategoriesFn({ data: { parent: null } }),
    ]);
    return { identity, catalog, categories: categories.categories };
  },
  component: ClientArea,
});

function ClientArea() {
  const {
    identity,
    catalog: initialCatalog,
    categories: initialCategories,
  } = Route.useLoaderData();
  const router = useRouter();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [categories, setCategories] = useState(initialCategories);
  const [path, setPath] = useState<ClientTaxonomyCategory[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState<string | null>(null);
  const selectedCategory = path.at(-1) ?? null;

  const categoryRequest = useRef(0);
  const queryData = (skip: number) => ({
    ...(query.trim() ? { search: query.trim() } : {}),
    ...(selectedCategory
      ? { taxonomyCode: selectedCategory.code, taxonomyLevel: selectedCategory.level }
      : {}),
    skip,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void getClientCatalogFn({
        data: {
          ...(query.trim() ? { search: query.trim() } : {}),
          ...(selectedCategory
            ? { taxonomyCode: selectedCategory.code, taxonomyLevel: selectedCategory.level }
            : {}),
          skip: 0,
        },
      })
        .then((nextCatalog) => {
          if (!cancelled) setCatalog(nextCatalog);
        })
        .catch(() => {
          // Preserve the last authorized results if a transient search request fails.
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 275);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, selectedCategory]);

  const browse = async (category: ClientTaxonomyCategory) => {
    const nextPath = [...path, category];
    setPath(nextPath);
    const request = ++categoryRequest.current;
    const children = await getClientTaxonomyCategoriesFn({ data: { parent: category } });
    if (request === categoryRequest.current) setCategories(children.categories);
  };

  const navigateCategory = async (nextPath: ClientTaxonomyCategory[]) => {
    setPath(nextPath);
    const request = ++categoryRequest.current;
    const selected = nextPath.at(-1) ?? null;
    const children = await getClientTaxonomyCategoriesFn({ data: { parent: selected } });
    if (request === categoryRequest.current) setCategories(children.categories);
  };

  const toggleFavorite = async (product: ClientCatalogProductDto) => {
    if (favoriteBusy) return;
    setFavoriteBusy(product.reference);
    try {
      const result = await setClientCatalogFavoriteFn({
        data: { productReference: product.reference, isFavorite: !product.isFavorite },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      setCatalog((current) => ({
        ...current,
        products: current.products.map((item) =>
          item.reference === product.reference ? { ...item, isFavorite: result.isFavorite } : item,
        ),
      }));
    } catch {
      // Keep the card state unchanged; server errors do not reveal catalog access details.
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
              aria-current="page"
              className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-[#102c50]"
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2342] via-[#123860] to-[#1d5077] px-6 py-9 text-white shadow-lg sm:px-10 sm:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            Wossol private catalog
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Discover products for your business.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
            Explore approved products, compare available formats, and save products for later.
          </p>
          {catalog.accessEnabled && (
            <div className="mt-7 flex max-w-3xl gap-2 rounded-xl bg-white p-2 shadow-xl">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3 text-slate-400">
                <Search className="h-5 w-5 shrink-0" />
                <span className="sr-only">Search products</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search product names or specifications"
                  className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>
            </div>
          )}
        </section>

        {!catalog.accessEnabled ? (
          <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <PackageSearch className="mx-auto h-12 w-12 text-[#17436a]" />
            <h2 className="mt-4 text-xl font-semibold">Catalog access is not enabled yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Please contact your Wossol representative if you believe catalog access should be
              available.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
                    Explore by category
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[#102c50]">Browse products</h2>
                </div>
                {path.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void navigateCategory([])}
                    className="text-sm font-semibold text-[#17436a] hover:underline"
                  >
                    Clear categories
                  </button>
                )}
              </div>
              {path.length > 0 && (
                <nav
                  aria-label="Category breadcrumb"
                  className="mt-4 flex flex-wrap items-center gap-2 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => void navigateCategory([])}
                    className="font-medium text-slate-500 hover:text-[#17436a]"
                  >
                    All categories
                  </button>
                  {path.map((item, index) => (
                    <span
                      key={`${item.level}:${item.code}`}
                      className="inline-flex items-center gap-2"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                      <button
                        type="button"
                        onClick={() => void navigateCategory(path.slice(0, index + 1))}
                        aria-current={index === path.length - 1 ? "page" : undefined}
                        className={
                          index === path.length - 1
                            ? "font-semibold text-[#102c50]"
                            : "text-slate-500 hover:text-[#17436a]"
                        }
                      >
                        {item.name}
                      </button>
                    </span>
                  ))}
                </nav>
              )}
              {path.length > 0 && (
                <button
                  type="button"
                  onClick={() => void navigateCategory(path.slice(0, -1))}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#17436a]"
                >
                  <ChevronLeft className="h-4 w-4" /> Back one level
                </button>
              )}
              {categories.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {categories.map((category) => (
                    <button
                      key={`${category.level}:${category.code}`}
                      type="button"
                      onClick={() => void browse(category)}
                      className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      {category.name}
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              ) : path.length > 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No further categories. Showing matching products below.
                </p>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No product categories are currently available.
                </p>
              )}
            </section>

            <section className="mt-9">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
                    Your selection
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#102c50]">
                    {selectedCategory?.name ?? "Available products"}
                  </h2>
                </div>
                <span className="text-sm text-slate-500">
                  {catalog.products.length} {catalog.products.length === 1 ? "product" : "products"}
                </span>
              </div>
              {loading ? (
                <p className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">
                  Loading catalog…
                </p>
              ) : catalog.products.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {catalog.products.map((product) => (
                    <ClientCatalogProductCard
                      key={product.reference}
                      product={product}
                      favoriteBusy={favoriteBusy === product.reference}
                      onToggleFavorite={(item) => void toggleFavorite(item)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <PackageSearch className="mx-auto h-9 w-9 text-slate-400" />
                  <h3 className="mt-3 font-semibold">No products match this view</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try another search or category, or contact your Wossol representative.
                  </p>
                </div>
              )}
              {catalog.hasMore && (
                <div className="mt-7 text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const next = await getClientCatalogFn({
                          data: queryData(catalog.products.length),
                        });
                        setCatalog((current) => ({
                          ...next,
                          products: [...current.products, ...next.products],
                        }));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102c50] disabled:opacity-60"
                  >
                    Load more products
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
