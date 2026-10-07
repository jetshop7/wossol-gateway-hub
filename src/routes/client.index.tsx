import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { ArrowRight, Boxes, LogOut, PackageSearch, Search, X } from "lucide-react";

import { Logo } from "@/components/Logo";
import {
  getClientAreaIdentity,
  getClientCatalogFn,
  getClientCatalogProductFn,
  getCurrentActor,
  logout,
} from "@/lib/api/auth.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/client/")({
  loader: async () => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "CLIENT") throw redirect({ to: "/sign-in" });
    const [identity, catalog] = await Promise.all([
      getClientAreaIdentity(),
      getClientCatalogFn({ data: {} }),
    ]);
    return { identity, catalog };
  },
  component: ClientArea,
});

function ClientArea() {
  const { identity, catalog: initialCatalog } = Route.useLoaderData();
  const router = useRouter();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [query, setQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<{
    code: string;
    level: "SEGMENT" | "FAMILY" | "CLASS" | "BRICK";
    name: string;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<(typeof catalog.products)[number] | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const taxonomyChoices = useMemo(() => {
    const choices = new Map<
      string,
      { code: string; level: "SEGMENT" | "FAMILY" | "CLASS" | "BRICK"; name: string }
    >();
    for (const product of catalog.products)
      for (const node of product.taxonomy) choices.set(`${node.level}:${node.code}`, node);
    return [...choices.values()];
  }, [catalog.products]);

  const catalogQuery = (skip: number) => ({
    ...(query.trim() ? { search: query.trim() } : {}),
    ...(selectedTaxonomy
      ? { taxonomyCode: selectedTaxonomy.code, taxonomyLevel: selectedTaxonomy.level }
      : {}),
    skip,
  });

  const search = async (event?: FormEvent) => {
    event?.preventDefault();
    const next = await getClientCatalogFn({ data: catalogQuery(0) });
    setCatalog(next);
  };

  const selectCategory = async (item: NonNullable<typeof selectedTaxonomy>) => {
    setSelectedTaxonomy(item);
    const next = await getClientCatalogFn({
      data: {
        ...(query.trim() ? { search: query.trim() } : {}),
        taxonomyCode: item.code,
        taxonomyLevel: item.level,
        skip: 0,
      },
    });
    setCatalog(next);
  };

  const clearCategory = async () => {
    setSelectedTaxonomy(null);
    const next = await getClientCatalogFn({
      data: { ...(query.trim() ? { search: query.trim() } : {}), skip: 0 },
    });
    setCatalog(next);
  };

  const loadMore = async () => {
    if (loadingMore || !catalog.hasMore) return;
    setLoadingMore(true);
    const nextOffset = catalog.products.length;
    try {
      const next = await getClientCatalogFn({ data: catalogQuery(nextOffset) });
      if (!next.accessEnabled) {
        setCatalog(next);
        return;
      }
      setCatalog((current) => ({ ...next, products: [...current.products, ...next.products] }));
    } finally {
      setLoadingMore(false);
    }
  };

  const openProduct = async (productId: string) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const result = await getClientCatalogProductFn({ data: { productId } });
      if (!result.product) {
        setDetailError("This product is no longer available in your catalog.");
        return;
      }
      setSelectedProduct(result.product);
    } catch {
      setDetailError("Product details could not be loaded. Please try again.");
    } finally {
      setDetailLoading(false);
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
            Private catalog · {identity.clientAccountName}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Discover products for your business.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
            Browse Wossol-approved products, compare available formats, and find the details your
            team needs.
          </p>
          {catalog.accessEnabled && (
            <form
              onSubmit={(event) => void search(event)}
              className="mt-7 flex max-w-3xl gap-2 rounded-xl bg-white p-2 shadow-xl"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3 text-slate-400">
                <Search className="h-5 w-5 shrink-0" />
                <span className="sr-only">Search catalog</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, companies or brands"
                  className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>
              <button className="rounded-lg bg-[#102c50] px-5 py-2 text-sm font-semibold text-white hover:bg-[#183d67]">
                Search
              </button>
            </form>
          )}
        </section>

        {!catalog.accessEnabled ? (
          <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#102c50]">
              <PackageSearch />
            </div>
            <h2 className="mt-4 text-xl font-semibold">Catalog access is not enabled yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your account is active. Please contact your Wossol representative if you believe
              catalog access should be available.
            </p>
          </section>
        ) : (
          <>
            {!!taxonomyChoices.length && (
              <section className="mt-8">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-700">Browse categories</h2>
                  {selectedTaxonomy && (
                    <button
                      type="button"
                      onClick={() => void clearCategory()}
                      className="text-xs font-semibold text-[#17436a]"
                    >
                      Clear category
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {taxonomyChoices.map((item) => (
                    <button
                      key={`${item.level}:${item.code}`}
                      type="button"
                      onClick={() => void selectCategory(item)}
                      className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${selectedTaxonomy?.code === item.code && selectedTaxonomy.level === item.level ? "border-[#102c50] bg-[#102c50] text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"}`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
                    Your selection
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {selectedTaxonomy?.name ?? "Available products"}
                  </h2>
                </div>
                <span className="text-sm text-slate-500">
                  {catalog.products.length} {catalog.products.length === 1 ? "product" : "products"}
                </span>
              </div>
              {catalog.products.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {catalog.products.map((product) => {
                    const image = product.variants.find(
                      (variant) => variant.mainImageUrl,
                    )?.mainImageUrl;
                    const price = product.variants.find((variant) => variant.price)?.price;
                    return (
                      <article
                        key={product.id}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <button
                          type="button"
                          onClick={() => void openProduct(product.id)}
                          className="block w-full text-left"
                        >
                          <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
                            {image ? (
                              <img
                                src={image}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-[#17436a] shadow-sm">
                                <Boxes className="h-9 w-9" />
                              </div>
                            )}
                            <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                              {product.variants.length}{" "}
                              {product.variants.length === 1 ? "format" : "formats"}
                            </span>
                          </div>
                          <div className="p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {product.companyName}
                              {product.brandName ? ` · ${product.brandName}` : ""}
                            </p>
                            <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-[#102c50]">
                              {product.name}
                            </h3>
                            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                              {product.shortDescription ??
                                product.description ??
                                "Explore product specifications and available formats."}
                            </p>
                            {product.taxonomy.length > 0 && (
                              <p className="mt-3 text-xs text-slate-500">
                                {product.taxonomy.at(-1)?.name}
                              </p>
                            )}
                            <div className="mt-4 flex items-center justify-between border-t pt-4">
                              <span className="text-sm font-semibold text-[#102c50]">
                                {price
                                  ? `${price.price} ${price.currency}`
                                  : catalog.pricesVisible
                                    ? "Price on request"
                                    : "Contact for pricing"}
                              </span>
                              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#17436a]">
                                Details{" "}
                                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                              </span>
                            </div>
                          </div>
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <PackageSearch className="mx-auto h-9 w-9 text-slate-400" />
                  <h3 className="mt-3 font-semibold">No products match this view</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try another search or category, or contact your Wossol representative for
                    access.
                  </p>
                </div>
              )}
              {catalog.hasMore && (
                <div className="mt-7 text-center">
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102c50] hover:bg-slate-50 disabled:opacity-60"
                  >
                    {loadingMore ? "Loading…" : "Load more products"}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {(detailLoading || detailError || selectedProduct) && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProduct(null);
              setDetailError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Product details"
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex justify-end border-b bg-white/95 p-3">
              <button
                type="button"
                aria-label="Close product details"
                onClick={() => {
                  setSelectedProduct(null);
                  setDetailError("");
                }}
                className="rounded-full border p-2 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {detailLoading ? (
              <p className="p-10 text-center text-sm text-slate-500">Loading product details…</p>
            ) : selectedProduct ? (
              <div className="p-5 sm:p-8">
                <p className="text-sm font-semibold text-slate-500">
                  {selectedProduct.companyName}
                  {selectedProduct.brandName ? ` · ${selectedProduct.brandName}` : ""}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#102c50] sm:text-3xl">
                  {selectedProduct.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {selectedProduct.description ??
                    selectedProduct.shortDescription ??
                    "Product specifications and available formats."}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {selectedProduct.countryOfOrigin
                    ? `Origin: ${selectedProduct.countryOfOrigin}`
                    : ""}
                  {selectedProduct.taxonomy.length
                    ? ` · ${selectedProduct.taxonomy.map((node) => node.name).join(" / ")}`
                    : ""}
                </p>
                <div className="mt-7 grid gap-4 md:grid-cols-2">
                  {selectedProduct.variants.map((variant) => (
                    <article
                      key={variant.id}
                      className="overflow-hidden rounded-xl border border-slate-200"
                    >
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3">
                        {[variant.mainImageUrl, ...variant.additionalImageUrls]
                          .filter(Boolean)
                          .slice(0, 4)
                          .map((src) => (
                            <img
                              key={src}
                              src={src!}
                              alt=""
                              loading="lazy"
                              className="h-36 w-full rounded-lg bg-white object-cover"
                            />
                          ))}
                        {!variant.mainImageUrl && !variant.additionalImageUrls.length && (
                          <div className="col-span-2 flex h-36 items-center justify-center rounded-lg bg-blue-50 text-[#17436a]">
                            <Boxes className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-[#102c50]">
                          {variant.name ?? variant.model ?? "Available format"}
                        </h3>
                        {variant.model && variant.name && (
                          <p className="mt-1 text-sm text-slate-500">{variant.model}</p>
                        )}
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          {Object.entries(variant.packaging).map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-xs text-slate-500">
                                {key.replace(/([A-Z])/g, " $1")}
                              </dt>
                              <dd className="font-medium text-slate-800">{String(value)}</dd>
                            </div>
                          ))}
                        </dl>
                        <p className="mt-4 border-t pt-3 text-sm font-semibold text-[#102c50]">
                          {variant.price
                            ? `${variant.price.price} ${variant.price.currency}`
                            : catalog.pricesVisible
                              ? "Price on request"
                              : "Contact for pricing"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <p role="alert" className="p-8 text-sm text-slate-600">
                {detailError}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
