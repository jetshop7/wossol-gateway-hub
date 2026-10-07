import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";

import { TaxonomySelector } from "@/components/TaxonomySelector";
import {
  addAdminClientVisibilityRuleFn,
  listAdminClientVisibilityRulesFn,
  removeAdminClientVisibilityRuleFn,
  searchAdminVisibilityCompaniesFn,
  searchAdminVisibilityProductsFn,
} from "@/lib/api/commercial-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";
import type { AdminTaxonomySelection } from "@/server/catalog/catalog.taxonomy";

type Effect = "INCLUDE" | "EXCLUDE";
type TargetType = "TAXONOMY" | "COMPANY" | "PRODUCT";
type Rule = {
  id: string;
  effect: Effect;
  targetType: TargetType;
  target: {
    id: string;
    name: string;
    secondaryId?: string;
    companyName?: string;
    sourceCode?: string;
    level?: string;
    breadcrumb?: Array<{ name: string }>;
  };
};
type DirectTarget = { id: string; name: string; secondaryId: string; companyName?: string };
type Action = `${Effect}_${TargetType}`;

export function ClientCatalogAccessEditor({
  clientAccountId,
  catalogAccessMode,
}: {
  clientAccountId: string;
  catalogAccessMode: "ALL_APPROVED" | "SELECTED";
}) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [action, setAction] = useState<Action | null>(null);
  const [query, setQuery] = useState("");
  const [targets, setTargets] = useState<DirectTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const effect = action?.startsWith("EXCLUDE_") ? "EXCLUDE" : "INCLUDE";
  const targetType = action?.endsWith("_COMPANY")
    ? "COMPANY"
    : action?.endsWith("_PRODUCT")
      ? "PRODUCT"
      : "TAXONOMY";
  const included = useMemo(() => rules.filter((rule) => rule.effect === "INCLUDE"), [rules]);
  const excluded = useMemo(() => rules.filter((rule) => rule.effect === "EXCLUDE"), [rules]);
  const configuredTaxonomyIds = useMemo(
    () =>
      rules
        .filter((rule) => rule.effect === effect && rule.targetType === "TAXONOMY")
        .map((rule) => rule.target.id),
    [effect, rules],
  );

  const loadRules = useCallback(async () => {
    const response = await listAdminClientVisibilityRulesFn({ data: { clientAccountId } });
    if (response.ok) setRules(response.rules);
  }, [clientAccountId]);

  useEffect(() => {
    let cancelled = false;
    void loadRules().catch(() => {
      if (!cancelled) setError("Catalog access rules could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, [loadRules]);

  useEffect(() => {
    const text = query.trim();
    if (!action || targetType === "TAXONOMY" || text.length < 2) {
      setTargets([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      const request =
        targetType === "COMPANY"
          ? searchAdminVisibilityCompaniesFn({
              data: { clientAccountId, effect, query: text },
            })
          : searchAdminVisibilityProductsFn({
              data: { clientAccountId, effect, query: text },
            });
      void request
        .then((response) => {
          if (!cancelled && response.ok) setTargets(response.targets);
        })
        .catch(() => {
          if (!cancelled) setError("Catalog targets could not be searched.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [action, clientAccountId, effect, query, targetType]);

  const begin = (nextAction: Action) => {
    setError("");
    setQuery("");
    setTargets([]);
    setAction((current) => (current === nextAction ? null : nextAction));
  };

  const add = async (targetId: string) => {
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      const response = await addAdminClientVisibilityRuleFn({
        data: { clientAccountId, effect, targetType, targetId },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setAction(null);
      setQuery("");
      setTargets([]);
      await loadRules();
      await router.invalidate();
    } catch {
      setError("The access rule could not be added.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (ruleId: string) => {
    setBusy(true);
    setError("");
    try {
      const response = await removeAdminClientVisibilityRuleFn({
        data: { clientAccountId, id: ruleId },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      await loadRules();
      await router.invalidate();
    } catch {
      setError("The access rule could not be removed.");
    } finally {
      setBusy(false);
    }
  };

  const renderRules = (items: Rule[]) =>
    items.length ? (
      <ul className="mt-2 space-y-2">
        {items.map((rule) => (
          <li
            key={rule.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded border bg-white p-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {rule.targetType === "TAXONOMY"
                  ? `Taxonomy · ${rule.target.name} · ${rule.target.level} · GPC ${rule.target.sourceCode}`
                  : `${rule.targetType === "COMPANY" ? "Company" : "Product"} · ${rule.target.name}`}
              </p>
              {rule.targetType === "TAXONOMY" && rule.target.breadcrumb && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {rule.target.breadcrumb.map((crumb) => crumb.name).join(" › ")}
                </p>
              )}
              {rule.targetType === "COMPANY" && rule.target.secondaryId && (
                <p className="text-xs text-slate-500">{rule.target.secondaryId}</p>
              )}
              {rule.targetType === "PRODUCT" && (
                <p className="text-xs text-slate-500">
                  {rule.target.companyName}
                  {rule.target.secondaryId ? ` · ${rule.target.secondaryId}` : ""}
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove(rule.id)}
              className="text-xs font-medium text-red-700 underline disabled:opacity-50"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-2 text-sm text-slate-500">No rules configured.</p>
    );

  return (
    <section className="w-full rounded-lg border bg-slate-50 p-4">
      <h3 className="font-semibold">Catalog access rules</h3>
      <p className="mt-1 text-xs text-slate-600">
        Includes are additive. Any matching exclusion wins. Taxonomy rules include descendants
        dynamically without creating extra rules.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border bg-white p-3">
          <h4 className="font-semibold">Included catalog</h4>
          {catalogAccessMode === "ALL_APPROVED" ? (
            <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="font-semibold text-emerald-950">Entire catalog</p>
              <p className="mt-1 text-sm text-emerald-900">
                All eligible companies, products, and categories are included by default.
              </p>
            </div>
          ) : (
            <>
              {renderRules(included)}
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton
                  label="Add Taxonomy"
                  active={action === "INCLUDE_TAXONOMY"}
                  onClick={() => begin("INCLUDE_TAXONOMY")}
                />
                <ActionButton
                  label="Add Company"
                  active={action === "INCLUDE_COMPANY"}
                  onClick={() => begin("INCLUDE_COMPANY")}
                />
                <ActionButton
                  label="Add Product"
                  active={action === "INCLUDE_PRODUCT"}
                  onClick={() => begin("INCLUDE_PRODUCT")}
                />
              </div>
            </>
          )}
        </section>
        <section className="rounded-md border bg-white p-3">
          <h4 className="font-semibold">Excluded catalog</h4>
          {renderRules(excluded)}
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton
              label="Exclude Taxonomy"
              active={action === "EXCLUDE_TAXONOMY"}
              onClick={() => begin("EXCLUDE_TAXONOMY")}
            />
            <ActionButton
              label="Exclude Company"
              active={action === "EXCLUDE_COMPANY"}
              onClick={() => begin("EXCLUDE_COMPANY")}
            />
            <ActionButton
              label="Exclude Product"
              active={action === "EXCLUDE_PRODUCT"}
              onClick={() => begin("EXCLUDE_PRODUCT")}
            />
          </div>
        </section>
      </div>

      {action && targetType === "TAXONOMY" && (
        <div className="mt-4 rounded-md border bg-white p-3">
          <TaxonomySelector
            selected={null}
            onSelect={(selection: AdminTaxonomySelection) => void add(selection.id)}
            onClear={() => undefined}
            selectionMode="ANY_LEVEL"
            clientAccountId={clientAccountId}
            visibilityEffect={effect}
            configuredSelectionIds={configuredTaxonomyIds}
            configuredSelectionLabel={effect === "EXCLUDE" ? "Excluded" : "Included"}
            title={effect === "EXCLUDE" ? "Exclude taxonomy" : "Add taxonomy include"}
            helperText={`Choose any Segment, Family, Class, or Brick. Descendants are ${effect === "EXCLUDE" ? "excluded" : "included"} automatically.`}
            clearLabel=""
          />
        </div>
      )}

      {action && targetType !== "TAXONOMY" && (
        <div className="mt-4 rounded-md border bg-white p-3">
          <label className="block text-sm font-medium">
            {targetType === "COMPANY" ? "Search Companies" : "Search Products"}
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, slug, or Wossol ID"
            />
          </label>
          {loading && <p className="mt-2 text-sm text-slate-500">Searching…</p>}
          {query.trim().length >= 2 && !loading && targets.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">No unconfigured matching targets found.</p>
          )}
          {targets.length > 0 && (
            <ul className="mt-2 max-h-60 space-y-1 overflow-auto">
              {targets.map((target) => (
                <li key={target.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void add(target.id)}
                    className="w-full rounded border p-2 text-left text-sm hover:bg-amber-50 disabled:opacity-50"
                  >
                    <span className="block font-medium">+ {target.name}</span>
                    <span className="block text-xs text-slate-500">
                      {target.companyName ? `${target.companyName} · ` : ""}
                      {target.secondaryId} · ID {target.id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function ActionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded border px-3 py-2 text-xs font-medium ${active ? "border-[#102c50] bg-slate-100 text-[#102c50]" : "bg-white hover:bg-slate-50"}`}
    >
      {label}
    </button>
  );
}
