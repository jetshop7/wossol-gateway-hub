import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FolderTree, Search } from "lucide-react";
import {
  browseAdminTaxonomyNodesFn,
  searchAdminTaxonomyNodesFn,
} from "@/lib/api/catalog-admin.functions";
import type {
  AdminTaxonomyLabel,
  AdminTaxonomySelection,
  CatalogTaxonomyLevel,
} from "@/server/catalog/catalog.taxonomy";

type BrowseNode = AdminTaxonomyLabel;
type Mode = "search" | "browse";

const levelNames: Record<CatalogTaxonomyLevel, string> = {
  SEGMENT: "Segment",
  FAMILY: "Family",
  CLASS: "Class",
  BRICK: "Brick",
};

export function TaxonomySelector({
  selected,
  onSelect,
  onClear,
}: {
  selected: AdminTaxonomySelection | null;
  onSelect: (selection: AdminTaxonomySelection) => void;
  onClear: () => void;
}) {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminTaxonomySelection[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [browseNodes, setBrowseNodes] = useState<BrowseNode[]>([]);
  const [browseCrumbs, setBrowseCrumbs] = useState<BrowseNode[]>([]);
  const [browseParentId, setBrowseParentId] = useState<string | null>(null);
  const [browsePage, setBrowsePage] = useState(0);
  const [browseHasMore, setBrowseHasMore] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const search = query.trim();
    if (mode !== "search" || !search) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      setSearchLoading(true);
      void searchAdminTaxonomyNodesFn({ data: { query: search } })
        .then((result) => {
          if (!cancelled && result.ok) setSearchResults(result.nodes);
        })
        .catch(() => {
          if (!cancelled) setError("Taxonomy search could not be loaded.");
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [mode, query]);

  useEffect(() => {
    if (mode !== "browse") return;
    let cancelled = false;
    setBrowseLoading(true);
    setError("");
    void browseAdminTaxonomyNodesFn({ data: { parentId: browseParentId, page: browsePage } })
      .then((result) => {
        if (!cancelled && result.ok) {
          setBrowseNodes((current) =>
            browsePage === 0 ? result.nodes : [...current, ...result.nodes],
          );
          setBrowseHasMore(result.hasMore);
        }
      })
      .catch(() => {
        if (!cancelled) setError("This taxonomy level could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setBrowseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [browsePage, browseParentId, mode]);

  const navigateBrowse = (crumbs: BrowseNode[]) => {
    setBrowseCrumbs(crumbs);
    setBrowseParentId(crumbs.at(-1)?.id ?? null);
    setBrowsePage(0);
    setBrowseNodes([]);
  };

  const chooseBrowseNode = (node: BrowseNode) => {
    const breadcrumb = [...browseCrumbs, node];
    if (node.level === "BRICK") {
      onSelect({ ...node, breadcrumb });
      return;
    }
    navigateBrowse(breadcrumb);
  };

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Product classification</h3>
          {selected ? (
            <div className="mt-2 text-sm" aria-live="polite">
              <p className="font-medium">
                {selected.name}{" "}
                <span className="font-normal text-slate-500">· GPC {selected.sourceCode}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {selected.breadcrumb.map((item) => item.name).join(" › ")}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Classification is optional.</p>
          )}
        </div>
        {selected && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-slate-700 underline"
          >
            Clear classification
          </button>
        )}
      </div>

      <div
        className="mt-4 inline-flex rounded-lg border bg-slate-50 p-1"
        aria-label="Taxonomy discovery mode"
      >
        <button
          type="button"
          aria-pressed={mode === "search"}
          onClick={() => setMode("search")}
          className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm ${mode === "search" ? "bg-white font-semibold shadow-sm" : "text-slate-600"}`}
        >
          <Search size={16} /> Search
        </button>
        <button
          type="button"
          aria-pressed={mode === "browse"}
          onClick={() => setMode("browse")}
          className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm ${mode === "browse" ? "bg-white font-semibold shadow-sm" : "text-slate-600"}`}
        >
          <FolderTree size={16} /> Browse categories
        </button>
      </div>

      {mode === "search" ? (
        <div className="mt-3">
          <label className="sr-only" htmlFor="taxonomy-search">
            Search category name or GPC code
          </label>
          <input
            id="taxonomy-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by category name or GPC code"
            className="h-10 w-full rounded border px-3"
          />
          <div className="mt-2 max-h-64 overflow-auto rounded border" aria-live="polite">
            {!query.trim() ? (
              <p className="p-3 text-sm text-slate-500">Search by product category or GPC code.</p>
            ) : searchLoading ? (
              <p className="p-3 text-sm text-slate-500">Searching categories…</p>
            ) : searchResults.length ? (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`block w-full border-b p-3 text-left text-sm last:border-b-0 hover:bg-slate-50 ${selected?.id === item.id ? "bg-amber-50" : ""}`}
                >
                  <span className="block font-medium">
                    {item.name}{" "}
                    <span className="font-normal text-slate-500">· GPC {item.sourceCode}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {item.breadcrumb
                      .slice(0, -1)
                      .map((crumb) => crumb.name)
                      .join(" › ")}
                  </span>
                </button>
              ))
            ) : (
              <p className="p-3 text-sm text-slate-500">No matching active GPC Bricks found.</p>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">Showing up to 25 matching Bricks.</p>
        </div>
      ) : (
        <div className="mt-3">
          <nav
            aria-label="GPC category breadcrumb"
            className="flex flex-wrap items-center gap-1 text-sm"
          >
            <button
              type="button"
              onClick={() => navigateBrowse([])}
              className={`rounded px-1 py-1 ${browseCrumbs.length ? "text-blue-800 underline" : "font-semibold"}`}
            >
              Segments
            </button>
            {browseCrumbs.map((crumb, index) => (
              <span key={crumb.id} className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="text-slate-400">
                  ›
                </span>
                {index === browseCrumbs.length - 1 ? (
                  <span className="max-w-56 truncate font-semibold" title={crumb.name}>
                    {crumb.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigateBrowse(browseCrumbs.slice(0, index + 1))}
                    className="max-w-56 truncate text-blue-800 underline"
                    title={crumb.name}
                  >
                    {crumb.name}
                  </button>
                )}
              </span>
            ))}
          </nav>
          {browseCrumbs.length > 0 && (
            <button
              type="button"
              onClick={() => navigateBrowse(browseCrumbs.slice(0, -1))}
              className="mt-2 inline-flex items-center gap-1 text-sm text-slate-700 underline"
            >
              <ChevronLeft size={16} /> Back one level
            </button>
          )}
          <div className="mt-2 max-h-64 overflow-auto rounded border" aria-live="polite">
            {browseLoading && browseNodes.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">
                Loading{" "}
                {browseCrumbs.length
                  ? levelNames[nextLevel(browseCrumbs.at(-1)!.level)]
                  : "segments"}
                …
              </p>
            ) : browseNodes.length ? (
              browseNodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => chooseBrowseNode(node)}
                  className="flex w-full items-center justify-between gap-3 border-b p-3 text-left text-sm last:border-b-0 hover:bg-slate-50"
                >
                  <span>
                    <span className="block font-medium">{node.name}</span>
                    <span className="text-xs text-slate-500">
                      {levelNames[node.level]} · GPC {node.sourceCode}
                    </span>
                  </span>
                  {node.level === "BRICK" ? (
                    <span className="shrink-0 text-xs font-semibold text-amber-800">Select</span>
                  ) : (
                    <ChevronRight size={17} className="shrink-0 text-slate-400" />
                  )}
                </button>
              ))
            ) : browseLoading ? null : (
              <p className="p-3 text-sm text-slate-500">No categories at this level.</p>
            )}
          </div>
          {browseHasMore && (
            <button
              type="button"
              disabled={browseLoading}
              onClick={() => setBrowsePage((page) => page + 1)}
              className="mt-2 rounded border px-3 py-2 text-sm disabled:opacity-50"
            >
              {browseLoading ? "Loading…" : "Load more categories"}
            </button>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Choose a Segment, then a Family, Class, and finally a Brick.
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}

function nextLevel(level: CatalogTaxonomyLevel): CatalogTaxonomyLevel {
  if (level === "SEGMENT") return "FAMILY";
  if (level === "FAMILY") return "CLASS";
  return "BRICK";
}
