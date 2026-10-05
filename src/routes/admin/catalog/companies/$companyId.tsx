import { cloneElement, useState, type FormEvent, type ReactElement } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Save, Tag } from "lucide-react";

import {
  getAdminCompanyDetail,
  createAdminBrandFn,
  createAdminProductFamilyFn,
  createAdminProductFn,
  updateAdminProductFn,
  updateAdminBrandFn,
  updateAdminCompanyFn,
} from "@/lib/api/catalog-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/admin/catalog/companies/$companyId")({
  loader: ({ params }) => getAdminCompanyDetail({ data: { companyId: params.companyId } }),
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const result = Route.useLoaderData();
  const navigate = useNavigate();
  const [brandFormOpen, setBrandFormOpen] = useState(false);
  const [brandEditing, setBrandEditing] = useState<string | null>(null);
  const [familyFormOpen, setFamilyFormOpen] = useState<string | null>(null);
  const [productFormOpen, setProductFormOpen] = useState<string | null>(null);
  const [productEditing, setProductEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const company = result.ok ? result.company : null;
  const [form, setForm] = useState(() =>
    company
      ? {
          displayName: company.displayName,
          legalName: company.legalName ?? "",
          countryCode: company.countryCode ?? "",
          website: company.website ?? "",
          category: company.category ?? "",
          internalNotes: company.internalNotes ?? "",
          status: company.status,
        }
      : {
          displayName: "",
          legalName: "",
          slug: "",
          countryCode: "",
          website: "",
          category: "",
          internalNotes: "",
          status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ARCHIVED",
        },
  );
  const [brandForm, setBrandForm] = useState({
    name: "",
    slug: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ARCHIVED",
  });
  const [familyForm, setFamilyForm] = useState({ name: "", description: "", status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ARCHIVED" });
  const [productForm, setProductForm] = useState({ name: "", shortDescription: "", description: "", internalNotes: "", publicationStatus: "DRAFT" as "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED" });
  if (!company)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {result.error}
        <Link to="/admin/catalog/companies" className="ml-2 font-semibold underline">
          Back to companies
        </Link>
      </div>
    );

  const saveCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await updateAdminCompanyFn({
        data: { companyId: company.id, data: form },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      if (!response.ok) setError(response.error);
      else
        await navigate({
          to: "/admin/catalog/companies/$companyId",
          params: { companyId: company.id },
          replace: true,
        });
    } catch {
      setError("The company could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = brandEditing
        ? await updateAdminBrandFn({
            data: { brandId: brandEditing, data: brandForm },
            headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
          })
        : await createAdminBrandFn({
            data: { companyId: company.id, data: brandForm },
            headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
          });
      if (!response.ok) setError(response.error);
      else {
        setBrandFormOpen(false);
        setBrandEditing(null);
        setBrandForm({ name: "", slug: "", status: "ACTIVE" });
        await navigate({
          to: "/admin/catalog/companies/$companyId",
          params: { companyId: company.id },
          replace: true,
        });
      }
    } catch {
      setError("The brand could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveFamily = async (event: FormEvent<HTMLFormElement>, brandId: string) => {
    event.preventDefault(); if (saving) return; setSaving(true); setError("");
    try {
      const response = await createAdminProductFamilyFn({ data: { companyId: company.id, brandId, data: familyForm }, headers: { "x-wossol-csrf": readCsrfToken() ?? "" } });
      if (!response.ok) setError(response.error); else { setFamilyFormOpen(null); setFamilyForm({ name: "", description: "", status: "ACTIVE" }); await navigate({ to: "/admin/catalog/companies/$companyId", params: { companyId: company.id }, replace: true }); }
    } catch { setError("The product family could not be saved. Please try again."); } finally { setSaving(false); }
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>, familyId: string) => {
    event.preventDefault(); if (saving) return; setSaving(true); setError("");
    try {
      const response = productEditing
        ? await updateAdminProductFn({ data: { companyId: company.id, productId: productEditing, data: productForm }, headers: { "x-wossol-csrf": readCsrfToken() ?? "" } })
        : await createAdminProductFn({ data: { companyId: company.id, productFamilyId: familyId, data: productForm }, headers: { "x-wossol-csrf": readCsrfToken() ?? "" } });
      if (!response.ok) setError(response.error); else { setProductFormOpen(null); setProductEditing(null); setProductForm({ name: "", shortDescription: "", description: "", internalNotes: "", publicationStatus: "DRAFT" }); await navigate({ to: "/admin/catalog/companies/$companyId", params: { companyId: company.id }, replace: true }); }
    } catch { setError("The product could not be saved. Please try again."); } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/admin/catalog/companies"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" /> Companies
      </Link>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Company record
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {company.displayName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage company details and its associated brands.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
          {company.status.toLowerCase()}
        </span>
      </div>
      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      <form
        onSubmit={saveCompany}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Company details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep canonical identity and operational notes current.
            </p>
          </div>
          <button
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#102c50] px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Display name *">
            <input
              required
              value={form.displayName}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            />
          </Field>
          <Field label="Legal name">
            <input
              value={form.legalName}
              onChange={(event) => setForm({ ...form, legalName: event.target.value })}
            />
          </Field>
          <Field label="Country code">
            <input
              maxLength={2}
              value={form.countryCode}
              onChange={(event) => setForm({ ...form, countryCode: event.target.value })}
            />
          </Field>
          <Field label="Website">
            <input
              type="url"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
            />
          </Field>
          <Field label="Category / sector">
            <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as typeof form.status })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
              Internal notes
            </span>
            <textarea
              rows={4}
              value={form.internalNotes}
              onChange={(event) => setForm({ ...form, internalNotes: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>
        </div>
      </form>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Brands</h2>
            <p className="mt-1 text-sm text-slate-500">Brands are scoped to this company.</p>
          </div>
          <button
            onClick={() => {
              setBrandEditing(null);
              setBrandForm({ name: "", slug: "", status: "ACTIVE" });
              setBrandFormOpen(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-amber-500 px-3 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" /> Add brand
          </button>
        </div>
        {brandFormOpen && (
          <form onSubmit={saveBrand} className="border-b border-slate-100 bg-slate-50 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Name *">
                <input
                  required
                  value={brandForm.name}
                  onChange={(event) => setBrandForm({ ...brandForm, name: event.target.value })}
                />
              </Field>
              <Field label="Slug *">
                <input
                  required
                  value={brandForm.slug}
                  onChange={(event) => setBrandForm({ ...brandForm, slug: event.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  value={brandForm.status}
                  onChange={(event) =>
                    setBrandForm({
                      ...brandForm,
                      status: event.target.value as typeof brandForm.status,
                    })
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                disabled={saving}
                className="inline-flex h-9 items-center rounded-md bg-[#102c50] px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : brandEditing ? "Save brand" : "Create brand"}
              </button>
              <button
                type="button"
                onClick={() => setBrandFormOpen(false)}
                className="h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {company.brands.length === 0 ? (
          <div className="p-10 text-center sm:p-14">
            <Tag className="mx-auto h-9 w-9 text-amber-500" />
            <h3 className="mt-3 font-semibold text-slate-950">No brands yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Add the first brand belonging to {company.displayName}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {company.brands.map((brand) => (
              <div key={brand.id}>
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="font-semibold text-slate-950">{brand.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    /{brand.slug} · {brand.status.toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setBrandEditing(brand.id);
                    setBrandForm({ name: brand.name, slug: brand.slug, status: brand.status });
                    setBrandFormOpen(true);
                  }}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:border-amber-500 hover:text-slate-950"
                >
                  Edit brand
                </button>
                <button
                  onClick={() => { setFamilyFormOpen(brand.id); setFamilyForm({ name: "", description: "", status: "ACTIVE" }); }}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-amber-300 px-3 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                >
                  Add product family
                </button>
                </div>
              {familyFormOpen === brand.id && (
                <form onSubmit={(event) => saveFamily(event, brand.id)} className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Product family *"><input required value={familyForm.name} onChange={(event) => setFamilyForm({ ...familyForm, name: event.target.value })} /></Field>
                    <Field label="Description"><input value={familyForm.description} onChange={(event) => setFamilyForm({ ...familyForm, description: event.target.value })} /></Field>
                  </div>
                  <div className="mt-3 flex gap-2"><button disabled={saving} className="rounded-md bg-[#102c50] px-3 py-2 text-xs font-semibold text-white">{saving ? "Saving…" : "Create family"}</button><button type="button" onClick={() => setFamilyFormOpen(null)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">Cancel</button></div>
                </form>
              )}
              {(brand.productFamilies ?? []).map((family) => (
                <div key={family.id} className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-sm font-semibold text-slate-900">{family.name}</p><p className="text-xs text-slate-500">{family.products?.length ?? 0} products · /{family.slug}</p></div>
                    <button onClick={() => { setProductFormOpen(family.id); setProductEditing(null); setProductForm({ name: "", shortDescription: "", description: "", internalNotes: "", publicationStatus: "DRAFT" }); }} className="inline-flex h-8 items-center justify-center rounded-md bg-amber-500 px-3 text-xs font-semibold text-slate-950">Add product</button>
                  </div>
                  {productFormOpen === family.id && (
                    <form onSubmit={(event) => saveProduct(event, family.id)} className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2">
                      <Field label="Product name *"><input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></Field>
                      <Field label="Publication status"><select value={productForm.publicationStatus} onChange={(event) => setProductForm({ ...productForm, publicationStatus: event.target.value as typeof productForm.publicationStatus })}><option value="DRAFT">Draft</option><option value="IN_REVIEW">In review</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></Field>
                      <Field label="Short description"><input value={productForm.shortDescription} onChange={(event) => setProductForm({ ...productForm, shortDescription: event.target.value })} /></Field>
                      <Field label="Internal notes"><input value={productForm.internalNotes} onChange={(event) => setProductForm({ ...productForm, internalNotes: event.target.value })} /></Field>
                      <div className="sm:col-span-2 flex gap-2"><button disabled={saving} className="rounded-md bg-[#102c50] px-3 py-2 text-xs font-semibold text-white">{saving ? "Saving…" : "Create product"}</button><button type="button" onClick={() => setProductFormOpen(null)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">Cancel</button></div>
                    </form>
                  )}
                  {(family.products ?? []).map((product) => <div key={product.id} className="mt-3 flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-3"><div><p className="text-sm font-medium text-slate-900">{product.name}</p><p className="text-xs text-slate-500">/{product.slug} · {product.publicationStatus.toLowerCase()}</p></div><button onClick={() => { setProductEditing(product.id); setProductFormOpen(family.id); setProductForm({ name: product.name, shortDescription: product.shortDescription ?? "", description: product.description ?? "", internalNotes: product.internalNotes ?? "", publicationStatus: product.publicationStatus }); }} className="text-xs font-semibold text-slate-700 underline">Edit product</button></div>)}
                </div>
              ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ className?: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </span>
      {cloneElement(children, {
        className:
          "h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100",
      })}
    </label>
  );
}
