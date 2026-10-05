import { cloneElement, useState, type FormEvent, type ReactElement } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Save, Tag } from "lucide-react";

import {
  getAdminCompanyDetail,
  createAdminBrandFn,
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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const company = result.ok ? result.company : null;
  const [form, setForm] = useState(() =>
    company
      ? {
          displayName: company.displayName,
          legalName: company.legalName ?? "",
          slug: company.slug,
          countryCode: company.countryCode ?? "",
          website: company.website ?? "",
          internalNotes: company.internalNotes ?? "",
          status: company.status,
        }
      : {
          displayName: "",
          legalName: "",
          slug: "",
          countryCode: "",
          website: "",
          internalNotes: "",
          status: "ACTIVE" as const,
        },
  );
  const [brandForm, setBrandForm] = useState({
    name: "",
    slug: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ARCHIVED",
  });
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
          <Field label="Slug *">
            <input
              required
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
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
              <div
                key={brand.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
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
