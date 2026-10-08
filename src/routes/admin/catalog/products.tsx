import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Package, Search } from "lucide-react";

import { TaxonomySelector } from "@/components/TaxonomySelector";
import {
  getAdminProductsDirectoryFn,
  searchAdminCompanyOptionsFn,
} from "@/lib/api/catalog-admin.functions";
import type { AdminTaxonomySelection } from "@/server/catalog/catalog.taxonomy";
import {
  createLatestRequestGate,
  directoryFilterDelay,
  type DirectoryFilters,
} from "@/lib/admin-product-directory-requests";

const defaultQuery = { query: "", page: 0, pageSize: 25 };

export const Route = createFileRoute("/admin/catalog/products")({
  loader: () => getAdminProductsDirectoryFn({ data: defaultQuery }),
  pendingComponent: () => (
    <p role="status" className="p-8 text-center text-sm text-slate-500">
      Loading products…
    </p>
  ),
  errorComponent: () => (
    <p role="alert" className="m-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
      Products could not be loaded. Please try again.
    </p>
  ),
  component: ProductsDirectoryPage,
});

function ProductsDirectoryPage() {
  const initialDirectory = Route.useLoaderData();
  const navigate = useNavigate();
  const [products, setProducts] = useState(initialDirectory.products);
  const [total, setTotal] = useState(initialDirectory.total);
  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [taxonomy, setTaxonomy] = useState<AdminTaxonomySelection | null>(null);
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [publicationStatus, setPublicationStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestGate = useRef(createLatestRequestGate());
  const previousFilters = useRef<DirectoryFilters>({
    query: "",
    companyId: "",
    taxonomyNodeId: "",
    countryOfOrigin: "",
    publicationStatus: "",
  });
  const hasMounted = useRef(false);
  const filters = useMemo<DirectoryFilters>(
    () => ({
      query,
      companyId,
      taxonomyNodeId: taxonomy?.id ?? "",
      countryOfOrigin,
      publicationStatus,
    }),
    [query, companyId, taxonomy?.id, countryOfOrigin, publicationStatus],
  );

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      previousFilters.current = filters;
      return;
    }
    const requestGateForEffect = requestGate.current;
    const requestId = requestGateForEffect.begin();
    const delay = directoryFilterDelay(previousFilters.current, filters);
    previousFilters.current = filters;
    setLoading(true);
    setError("");
    if (filters.countryOfOrigin.length === 1) {
      setLoading(false);
      return () => requestGateForEffect.invalidate();
    }
    const timer = window.setTimeout(() => {
      void getAdminProductsDirectoryFn({
        data: {
          query: filters.query,
          companyId: filters.companyId || undefined,
          taxonomyNodeId: filters.taxonomyNodeId || undefined,
          countryOfOrigin: filters.countryOfOrigin || undefined,
          publicationStatus: filters.publicationStatus
            ? (filters.publicationStatus as "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED")
            : undefined,
          page,
          pageSize: 25,
        },
      })
        .then((result) => {
          if (!requestGateForEffect.isCurrent(requestId)) return;
          setProducts(result.products);
          setTotal(result.total);
        })
        .catch(() => {
          if (requestGateForEffect.isCurrent(requestId))
            setError("Products could not be loaded. Please try again.");
        })
        .finally(() => {
          if (requestGateForEffect.isCurrent(requestId)) setLoading(false);
        });
    }, delay);
    return () => {
      window.clearTimeout(timer);
      requestGateForEffect.invalidate();
    };
  }, [filters, page]);

  const chooseCompanyAndCreate = () => {
    if (!selectedCompanyId) return;
    void navigate({
      to: "/admin/catalog/companies/$companyId",
      params: { companyId: selectedCompanyId },
      search: { addProduct: true },
    });
  };

  const lastPage = Math.max(0, Math.ceil(total / 25) - 1);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Catalog workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Products</h1>
          <p className="mt-2 text-sm text-slate-500">
            Search and manage products across all companies.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <CompanySearchPicker
            label="Choose company"
            placeholder="Search companies"
            onSelect={(company) => setSelectedCompanyId(company?.id ?? "")}
          />
          <button
            type="button"
            onClick={chooseCompanyAndCreate}
            disabled={!selectedCompanyId}
            className="h-10 rounded-md bg-[#102c50] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add product
          </button>
        </div>
      </header>

      <section className="space-y-4 rounded-xl border bg-white p-4" aria-label="Product filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative block text-sm lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-500">
              Product name or Wossol reference
            </span>
            <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Search products"
              className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3"
            />
          </label>
          <CompanySearchPicker
            label="Company filter"
            placeholder="Search any company"
            onSelect={(company) => {
              setCompanyId(company?.id ?? "");
              setPage(0);
            }}
          />
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">
              Country of origin
            </span>
            <input
              value={countryOfOrigin}
              onChange={(event) => {
                setCountryOfOrigin(event.target.value.toUpperCase().slice(0, 2));
                setPage(0);
              }}
              placeholder="ISO code, e.g. DZ"
              className="h-10 w-full rounded-md border border-slate-300 px-3"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">
              Publication status
            </span>
            <select
              value={publicationStatus}
              onChange={(event) => {
                setPublicationStatus(event.target.value);
                setPage(0);
              }}
              className="h-10 w-full rounded-md border border-slate-300 px-3"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_REVIEW">In review</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <TaxonomySelector
              selected={taxonomy}
              onSelect={(selection) => {
                setTaxonomy(selection);
                setPage(0);
              }}
              onClear={() => {
                setTaxonomy(null);
                setPage(0);
              }}
              title="Taxonomy filter"
              helperText="Optionally filter by one GS1 Brick."
            />
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b px-4 py-3 text-sm text-slate-500">
          {total} {total === 1 ? "product" : "products"} · page {page + 1} of{" "}
          {Math.max(1, lastPage + 1)}
        </div>
        {loading ? (
          <p role="status" className="p-10 text-center text-sm text-slate-500">
            Loading products…
          </p>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="mx-auto h-9 w-9 text-slate-400" />
            <h2 className="mt-3 font-semibold text-slate-900">No products found</h2>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters, or choose a company to add a product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Wossol reference</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Taxonomy</th>
                  <th className="px-4 py-3">Origin</th>
                  <th className="px-4 py-3">Active variants</th>
                  <th className="px-4 py-3">Publication</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{product.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {product.publicReference}
                    </td>
                    <td className="px-4 py-3">{product.companyName}</td>
                    <td className="px-4 py-3">
                      {product.taxonomy
                        ? `${product.taxonomy.name} · ${product.taxonomy.sourceCode}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{product.countryOfOrigin}</td>
                    <td className="px-4 py-3">{product.activeVariantCount}</td>
                    <td className="px-4 py-3">
                      {product.publicationStatus.replaceAll("_", " ").toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          void navigate({
                            to: "/admin/catalog/companies/$companyId",
                            params: { companyId: product.companyId },
                            search: { editProductId: product.id },
                          })
                        }
                        className="inline-flex items-center gap-1 font-semibold text-blue-800 underline"
                      >
                        Open <ArrowRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t p-3">
          <button
            type="button"
            disabled={loading || page === 0}
            onClick={() => setPage((current) => current - 1)}
            className="inline-flex items-center gap-1 rounded border px-3 py-2 text-sm disabled:opacity-40"
          >
            <ArrowLeft size={15} /> Previous
          </button>
          <button
            type="button"
            disabled={loading || page >= lastPage}
            onClick={() => setPage((current) => current + 1)}
            className="inline-flex items-center gap-1 rounded border px-3 py-2 text-sm disabled:opacity-40"
          >
            Next <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}

function CompanySearchPicker({
  label,
  placeholder,
  onSelect,
}: {
  label: string;
  placeholder: string;
  onSelect: (
    company: { id: string; displayName: string; countryCode: string | null } | null,
  ) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<
    { id: string; displayName: string; countryCode: string | null }[]
  >([]);
  const [selected, setSelected] = useState<{
    id: string;
    displayName: string;
    countryCode: string | null;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setOptions([]);
      void searchAdminCompanyOptionsFn({ data: { query } })
        .then((result) => {
          if (cancelled) return;
          setOptions(result.companies);
          setError("");
        })
        .catch(() => {
          if (!cancelled) setError("Company choices could not be loaded.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="relative block text-sm">
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-slate-500">
        {label}
      </label>
      <div className="flex gap-1">
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          value={selected?.displayName ?? query}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setSelected(null);
            onSelect(null);
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3"
        />
        {selected && (
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setQuery("");
              onSelect(null);
              setOpen(true);
            }}
            className="rounded border px-2 text-slate-600"
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div
          id={`${id}-options`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white p-1 shadow-lg"
        >
          {options.length ? (
            options.map((company) => (
              <button
                key={company.id}
                type="button"
                role="option"
                aria-selected={selected?.id === company.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSelected(company);
                  setQuery(company.displayName);
                  setOpen(false);
                  onSelect(company);
                }}
                className="block w-full rounded px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="block font-medium">{company.displayName}</span>
                {company.countryCode && (
                  <span className="text-xs text-slate-500">{company.countryCode}</span>
                )}
              </button>
            ))
          ) : (
            <p
              role={error ? "alert" : loading ? "status" : undefined}
              className="px-3 py-2 text-xs text-slate-500"
            >
              {error ||
                (loading
                  ? "Searching companies…"
                  : query
                    ? "No matching companies."
                    : "Type to search companies.")}
            </p>
          )}
          {error && options.length > 0 && (
            <p role="alert" className="px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
