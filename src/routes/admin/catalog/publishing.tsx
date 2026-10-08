import { useEffect, useRef, useState } from "react";
import { createFileRoute, useLoaderData, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

import {
  getAdminProductsDirectoryFn,
  transitionAdminProductPublicationFn,
} from "@/lib/api/catalog-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";
import { createLatestRequestGate } from "@/lib/admin-product-directory-requests";

const pageSize = 25;
const defaultQuery = { query: "", page: 0, pageSize, publicationStatus: undefined };
const statuses = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"] as const;
type Status = (typeof statuses)[number];

export const Route = createFileRoute("/admin/catalog/publishing")({
  loader: () => getAdminProductsDirectoryFn({ data: defaultQuery }),
  pendingComponent: () => (
    <p role="status" className="p-8 text-center">
      Loading Publishing…
    </p>
  ),
  errorComponent: () => (
    <p role="alert" className="m-6 rounded bg-red-50 p-4 text-red-700">
      Publishing could not be loaded. Please try again.
    </p>
  ),
  component: PublishingPage,
});

function PublishingPage() {
  const initial = Route.useLoaderData();
  const { actor } = useLoaderData({ from: "/admin/catalog" });
  const navigate = useNavigate();
  const canPublish = actor?.role === "CATALOG_ADMIN";
  const [products, setProducts] = useState(initial.products);
  const [total, setTotal] = useState(initial.total);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, Status | "">>({});
  const gate = useRef(createLatestRequestGate());
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const requestGateForEffect = gate.current;
    const requestId = requestGateForEffect.begin();
    setLoading(true);
    setError("");
    const timer = window.setTimeout(
      () => {
        void getAdminProductsDirectoryFn({
          data: {
            query,
            publicationStatus: status || undefined,
            page,
            pageSize,
          },
        })
          .then((result) => {
            if (!requestGateForEffect.isCurrent(requestId)) return;
            setProducts(result.products);
            setTotal(result.total);
          })
          .catch(() => {
            if (requestGateForEffect.isCurrent(requestId))
              setError("Publishing products could not be loaded. Please try again.");
          })
          .finally(() => {
            if (requestGateForEffect.isCurrent(requestId)) setLoading(false);
          });
      },
      query ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      requestGateForEffect.invalidate();
    };
  }, [query, status, page]);

  const changeStatus = async (product: (typeof products)[number]) => {
    const nextStatus = pendingStatuses[product.id];
    if (!canPublish || !nextStatus || nextStatus === product.publicationStatus || busyId) return;
    const label = nextStatus.replaceAll("_", " ").toLowerCase();
    const unpublishing = product.publicationStatus === "PUBLISHED" && nextStatus !== "PUBLISHED";
    const requiresConfirmation =
      nextStatus === "PUBLISHED" || nextStatus === "ARCHIVED" || unpublishing;
    if (
      requiresConfirmation &&
      !window.confirm(
        nextStatus === "PUBLISHED"
          ? `Publish “${product.name}”? Eligible client accounts may see it according to their existing catalog access rules.`
          : nextStatus === "ARCHIVED"
            ? `Archive “${product.name}”? It will no longer appear in the Client catalog.`
            : `Move “${product.name}” to ${label}? It will no longer appear in the Client catalog.`,
      )
    )
      return;
    setBusyId(product.id);
    setError("");
    try {
      const result = await transitionAdminProductPublicationFn({
        data: { productId: product.id, publicationStatus: nextStatus },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (status && status !== result.publicationStatus) {
        setProducts((current) => current.filter((item) => item.id !== product.id));
        setTotal((current) => Math.max(0, current - 1));
        if (products.length === 1 && page > 0) setPage((current) => current - 1);
      } else {
        setProducts((current) =>
          current.map((item) =>
            item.id === product.id
              ? { ...item, publicationStatus: result.publicationStatus }
              : item,
          ),
        );
      }
      setPendingStatuses((current) => ({ ...current, [product.id]: "" }));
    } catch {
      setError("Publication status could not be changed. Please try again.");
    } finally {
      setBusyId("");
    }
  };

  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
          Catalog operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Publishing</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review product readiness and control Client catalog publication.
        </p>
      </header>
      <section
        className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px]"
        aria-label="Publishing filters"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">
            Product name or Wossol reference
          </span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Search products"
            className="h-10 w-full rounded-md border border-slate-300 px-3"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">
            Publication status
          </span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as Status | "");
              setPage(0);
            }}
            className="h-10 w-full rounded-md border border-slate-300 px-3"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
        </label>
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
            <ShieldCheck className="mx-auto h-9 w-9 text-slate-400" />
            <h2 className="mt-3 font-semibold">No products to display</h2>
            <p className="mt-1 text-sm text-slate-500">Try another search or publication status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Wossol reference</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Active variants</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{product.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{product.publicReference}</td>
                    <td className="px-4 py-3">{product.companyName}</td>
                    <td className="px-4 py-3">{product.activeVariantCount}</td>
                    <td className="px-4 py-3">
                      {product.publicationStatus.replaceAll("_", " ").toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {canPublish ? (
                        <div className="flex gap-2">
                          <select
                            aria-label={`New status for ${product.name}`}
                            value={pendingStatuses[product.id] ?? ""}
                            onChange={(event) =>
                              setPendingStatuses((current) => ({
                                ...current,
                                [product.id]: event.target.value as Status | "",
                              }))
                            }
                            className="h-9 rounded border px-2"
                          >
                            <option value="">Choose…</option>
                            {statuses
                              .filter((item) => item !== product.publicationStatus)
                              .map((item) => (
                                <option key={item} value={item}>
                                  {item.replaceAll("_", " ").toLowerCase()}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            disabled={!pendingStatuses[product.id] || busyId !== ""}
                            onClick={() => void changeStatus(product)}
                            className="rounded bg-[#102c50] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                          >
                            {busyId === product.id ? "Saving…" : "Update"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Publishing permission required
                        </span>
                      )}
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
                        Open editor <ArrowRight size={15} />
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
