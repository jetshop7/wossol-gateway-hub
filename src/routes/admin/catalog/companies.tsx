import { cloneElement, useState, type FormEvent, type ReactElement } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Globe2, Plus, Search } from "lucide-react";

import { createAdminCompanyFn, getAdminCompanies } from "@/lib/api/catalog-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

export const Route = createFileRoute("/admin/catalog/companies")({
  loader: () => getAdminCompanies(),
  component: CompaniesPage,
});

function CompaniesPage() {
  const result = Route.useLoaderData();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    legalName: "",
    slug: "",
    countryCode: "",
    website: "",
    internalNotes: "",
  });
  const companies = result.ok ? result.companies : [];
  const filtered = companies.filter((company) =>
    `${company.displayName} ${company.legalName ?? ""} ${company.countryCode ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const createCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await createAdminCompanyFn({
        data: form,
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      await navigate({
        to: "/admin/catalog/companies/$companyId",
        params: { companyId: response.company.id },
      });
    } catch {
      setError("The company could not be created. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Catalog foundation
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Companies</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Build the canonical company and brand hierarchy used by Wossol Export.
          </p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#102c50] px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Add company
        </button>
      </div>
      {showForm && (
        <form
          onSubmit={createCompany}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Add company</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a company record before adding its brands.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
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
                placeholder="company-slug"
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
                placeholder="DZ"
              />
            </Field>
            <Field label="Website">
              <input
                type="url"
                value={form.website}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
                placeholder="https://example.com"
              />
            </Field>
            <Field label="Internal notes">
              <input
                value={form.internalNotes}
                onChange={(event) => setForm({ ...form, internalNotes: event.target.value })}
              />
            </Field>
          </div>
          <button
            disabled={saving}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-amber-500 px-4 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create company"}
          </button>
        </form>
      )}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Company directory</h2>
            <p className="mt-1 text-xs text-slate-500">
              {companies.length} {companies.length === 1 ? "company" : "companies"}
            </p>
          </div>
          <label className="relative block sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search companies"
              className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
            />
          </label>
        </div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center sm:p-16">
            <Building2 className="mx-auto h-10 w-10 text-amber-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-950">
              {companies.length === 0 ? "No companies yet" : "No matching companies"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {companies.length === 0
                ? "Start the catalog foundation by adding the first company."
                : "Try a different search term."}
            </p>
            {companies.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" /> Add first company
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Country</th>
                  <th className="px-5 py-3 font-semibold">Website</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link
                        to="/admin/catalog/companies/$companyId"
                        params={{ companyId: company.id }}
                        className="font-semibold text-slate-950 hover:text-amber-700"
                      >
                        {company.displayName}
                      </Link>
                      {company.legalName && (
                        <p className="mt-1 text-xs text-slate-500">{company.legalName}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{company.countryCode ?? "—"}</td>
                    <td className="px-5 py-4">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-700"
                        >
                          <Globe2 className="h-3.5 w-3.5" /> Visit
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={company.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(company.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/admin/catalog/companies/$companyId"
                        params={{ companyId: company.id }}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-amber-700"
                      >
                        Open <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
    >
      {status.toLowerCase()}
    </span>
  );
}
