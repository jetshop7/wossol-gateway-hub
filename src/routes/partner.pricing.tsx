import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { PartnerWorkspaceHeader } from "@/components/PartnerWorkspaceHeader";
import { getCurrentActor } from "@/lib/api/auth.functions";
import {
  getPartnerResalePricingCatalogFn,
  getPartnerResalePricingFn,
  getPartnerWorkspaceIdentityFn,
  removePartnerResaleProductOverrideFn,
  removePartnerResaleVariantOverrideFn,
  savePartnerResaleDefaultFn,
  savePartnerResaleProductOverrideFn,
  savePartnerResaleVariantOverrideFn,
} from "@/lib/api/partner.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/partner/pricing")({
  loader: async () => {
    const actor = await getCurrentActor();
    if (actor.actor?.actorType !== "PARTNER") throw redirect({ to: "/sign-in" });
    const [identity, pricing, catalog] = await Promise.all([
      getPartnerWorkspaceIdentityFn(),
      getPartnerResalePricingFn(),
      getPartnerResalePricingCatalogFn(),
    ]);
    return { identity, pricing, catalog };
  },
  component: PartnerPricingPage,
});

type RuleForm = {
  mode: "NONE" | "PERCENTAGE_ADDITION" | "FIXED_ADDITION";
  value: string;
  currencyCode: string;
};

const csrfHeaders = () => ({ headers: { "x-wossol-csrf": readCsrfToken() ?? "" } });

function rulePayload(form: RuleForm) {
  return form.mode === "NONE"
    ? { mode: null, value: null, currencyCode: null }
    : {
        mode: form.mode,
        value: form.value.trim() || null,
        currencyCode: form.mode === "FIXED_ADDITION" ? form.currencyCode.trim() || null : null,
      };
}

function RuleFields({ form, setForm }: { form: RuleForm; setForm: (next: RuleForm) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <select
        value={form.mode}
        onChange={(event) => setForm({ ...form, mode: event.target.value as RuleForm["mode"] })}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        aria-label="Pricing rule type"
      >
        <option value="NONE">No addition</option>
        <option value="PERCENTAGE_ADDITION">Percentage addition</option>
        <option value="FIXED_ADDITION">Fixed addition</option>
      </select>
      <input
        value={form.value}
        onChange={(event) => setForm({ ...form, value: event.target.value })}
        disabled={form.mode === "NONE"}
        inputMode="decimal"
        placeholder={form.mode === "PERCENTAGE_ADDITION" ? "e.g. 10" : "e.g. 250"}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        aria-label="Pricing addition"
      />
      <input
        value={form.currencyCode}
        onChange={(event) => setForm({ ...form, currencyCode: event.target.value.toUpperCase() })}
        disabled={form.mode !== "FIXED_ADDITION"}
        maxLength={3}
        placeholder="DZD"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase disabled:bg-slate-100"
        aria-label="Fixed addition currency"
      />
    </div>
  );
}

function PartnerPricingPage() {
  const { identity, pricing: initialPricing, catalog } = Route.useLoaderData();
  const [pricing, setPricing] = useState(initialPricing);
  const [defaultForm, setDefaultForm] = useState<RuleForm>({
    mode: initialPricing.defaultRule?.mode ?? "NONE",
    value: initialPricing.defaultRule?.value ?? "",
    currencyCode: initialPricing.defaultRule?.currencyCode ?? "DZD",
  });
  const [productReference, setProductReference] = useState(catalog.products[0]?.publicReference ?? "");
  const [variantSku, setVariantSku] = useState(catalog.products[0]?.variants[0]?.sku ?? "");
  const [productForm, setProductForm] = useState<RuleForm>({ mode: "PERCENTAGE_ADDITION", value: "", currencyCode: "DZD" });
  const [variantForm, setVariantForm] = useState<RuleForm>({ mode: "PERCENTAGE_ADDITION", value: "", currencyCode: "DZD" });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => setPricing(await getPartnerResalePricingFn());
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await refresh();
      setMessage("Pricing saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pricing could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <PartnerWorkspaceHeader identity={identity} current="pricing" />
      <main className="mx-auto max-w-7xl space-y-7 px-4 py-9 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#0b2342] via-[#123860] to-[#1d5077] p-8 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Partner workspace</p>
          <h1 className="mt-2 text-3xl font-semibold">Resale pricing</h1>
          <p className="mt-2 text-sm text-blue-100">Prices are additions to the Wossol-assigned price and exclude taxes, duties, freight and other future charges.</p>
        </section>

        {message && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{message}</p>}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#102c50]">Default rule</h2>
          <p className="mt-1 text-sm text-slate-500">Used when no product or variant override exists.</p>
          <div className="mt-4"><RuleFields form={defaultForm} setForm={setDefaultForm} /></div>
          <button type="button" disabled={busy} onClick={() => void run(() => savePartnerResaleDefaultFn({ data: rulePayload(defaultForm), ...csrfHeaders() }))} className="mt-4 rounded-lg bg-[#102c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save default</button>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#102c50]">Product override</h2>
          <p className="mt-1 text-sm text-slate-500">Product rules apply after the default and before a variant rule.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr]">
            <select value={productReference} onChange={(event) => setProductReference(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Product">
              {catalog.products.map((product) => <option key={product.publicReference} value={product.publicReference}>{product.name} ({product.publicReference})</option>)}
            </select>
            <RuleFields form={productForm} setForm={setProductForm} />
          </div>
          <button type="button" disabled={busy || !productReference} onClick={() => void run(() => savePartnerResaleProductOverrideFn({ data: { productReference, rule: rulePayload(productForm) }, ...csrfHeaders() }))} className="mt-4 rounded-lg bg-[#102c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save product override</button>
          <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            {pricing.productOverrides.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{item.productName} · {item.productReference} — {item.rule.mode === "PERCENTAGE_ADDITION" ? `${item.rule.value}%` : `${item.rule.value} ${item.rule.currencyCode}`}</span><button type="button" disabled={busy} onClick={() => void run(() => removePartnerResaleProductOverrideFn({ data: { productReference: item.productReference }, ...csrfHeaders() }))} className="text-red-700 underline">Remove</button></div>)}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#102c50]">Variant override</h2>
          <p className="mt-1 text-sm text-slate-500">Variant rules have the highest precedence.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr]">
            <select value={variantSku} onChange={(event) => setVariantSku(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Variant">
              {catalog.products.flatMap((product) => product.variants.map((variant) => <option key={variant.sku} value={variant.sku}>{product.name} · {variant.name ?? variant.model ?? variant.sku}</option>))}
            </select>
            <RuleFields form={variantForm} setForm={setVariantForm} />
          </div>
          <button type="button" disabled={busy || !variantSku} onClick={() => void run(() => savePartnerResaleVariantOverrideFn({ data: { variantSku, rule: rulePayload(variantForm) }, ...csrfHeaders() }))} className="mt-4 rounded-lg bg-[#102c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save variant override</button>
          <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            {pricing.variantOverrides.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{item.productName} · {item.variantName ?? item.variantModel ?? item.variantSku} — {item.rule.mode === "PERCENTAGE_ADDITION" ? `${item.rule.value}%` : `${item.rule.value} ${item.rule.currencyCode}`}</span><button type="button" disabled={busy} onClick={() => void run(() => removePartnerResaleVariantOverrideFn({ data: { variantSku: item.variantSku }, ...csrfHeaders() }))} className="text-red-700 underline">Remove</button></div>)}
          </div>
        </section>
      </main>
    </div>
  );
}
