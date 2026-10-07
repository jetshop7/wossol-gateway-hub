import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Users } from "lucide-react";

import {
  createAdminClientAccountFn,
  listAdminClientAccountsFn,
  listAdminPriceProfilesFn,
  updateAdminClientAccountFn,
} from "@/lib/api/commercial-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";
import { ClientCatalogAccessEditor } from "@/components/ClientCatalogAccessEditor";
import { ClientAccountUsersPanel } from "@/components/ClientAccountUsersPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/catalog/clients")({
  loader: async () => {
    const [clients, profiles] = await Promise.all([
      listAdminClientAccountsFn(),
      listAdminPriceProfilesFn(),
    ]);
    return { clients, profiles };
  },
  component: ClientAccountsPage,
});

type ClientForm = {
  name: string;
  status: "ACTIVE" | "INACTIVE";
  priceProfileId: string;
  pricesVisible: boolean;
  catalogAccessStatus: "ENABLED" | "DISABLED";
  catalogAccessMode: "ALL_APPROVED" | "SELECTED";
};

function ClientAccountsPage() {
  const result = Route.useLoaderData();
  const router = useRouter();
  const clients = result.clients.ok ? result.clients.clients : [];
  const profiles = result.profiles.ok ? result.profiles.profiles : [];
  const [form, setForm] = useState<ClientForm>({
    name: "",
    status: "ACTIVE",
    priceProfileId: profiles.find((profile) => profile.status === "ACTIVE")?.id ?? "",
    pricesVisible: false,
    catalogAccessStatus: "DISABLED",
    catalogAccessMode: "SELECTED",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedAccessId, setExpandedAccessId] = useState<string | null>(null);
  const [expandedUsersId, setExpandedUsersId] = useState<string | null>(null);
  const [confirmModeChange, setConfirmModeChange] = useState(false);
  const beginCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      status: "ACTIVE",
      priceProfileId: profiles.find((profile) => profile.status === "ACTIVE")?.id ?? "",
      pricesVisible: false,
      catalogAccessStatus: "DISABLED",
      catalogAccessMode: "SELECTED",
    });
    setShowForm(true);
    setError("");
  };

  const edit = (client: (typeof clients)[number]) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      status: client.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      priceProfileId: client.priceProfileId ?? "",
      pricesVisible: client.pricesVisible,
      catalogAccessStatus: client.catalogAccessStatus,
      catalogAccessMode: client.catalogAccessMode,
    });
    setShowForm(true);
    setError("");
  };

  const performSave = async () => {
    const existingMode = clients.find((client) => client.id === editingId)?.catalogAccessMode;
    setConfirmModeChange(false);
    setBusy(true);
    setError("");
    try {
      const response = editingId
        ? await updateAdminClientAccountFn({
            data: { id: editingId, data: form },
            headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
          })
        : await createAdminClientAccountFn({
            data: form,
            headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
          });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setShowForm(false);
      setEditingId(null);
      await router.invalidate();
    } catch {
      setError("Client Account could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const existingMode = clients.find((client) => client.id === editingId)?.catalogAccessMode;
    if (existingMode && existingMode !== form.catalogAccessMode) {
      setConfirmModeChange(true);
      return;
    }
    await performSave();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Commercial access
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Client Accounts</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Manage account status, assigned pricing policy, price visibility, and catalog access.
          </p>
        </div>
        <button
          type="button"
          onClick={beginCreate}
          disabled={!profiles.some((profile) => profile.status === "ACTIVE")}
          className="inline-flex items-center gap-2 rounded-md bg-[#102c50] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add Client Account
        </button>
      </header>

      {!profiles.some((profile) => profile.status === "ACTIVE") && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Create an active Price Profile before adding or assigning a Client Account.{" "}
          <Link to="/admin/catalog/price-profiles" className="font-semibold underline">
            Open Price Profiles
          </Link>
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={save} className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
          <h2 className="text-lg font-semibold sm:col-span-2">
            {editingId ? "Edit Client Account" : "Create Client Account"}
          </h2>
          <Field label="Client / company name *">
            <input
              required
              maxLength={200}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Price Profile *">
            <select
              required
              value={form.priceProfileId}
              onChange={(event) => setForm({ ...form, priceProfileId: event.target.value })}
            >
              <option value="">Choose a profile</option>
              {profiles
                .filter((profile) => profile.status === "ACTIVE")
                .map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Account status">
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as ClientForm["status"] })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <Field label="Catalog access status">
            <select
              value={form.catalogAccessStatus}
              onChange={(event) =>
                setForm({
                  ...form,
                  catalogAccessStatus: event.target.value as ClientForm["catalogAccessStatus"],
                })
              }
            >
              <option value="DISABLED">Disabled</option>
              <option value="ENABLED">Enabled</option>
            </select>
          </Field>
          <Field label="Catalog access mode">
            <select
              value={form.catalogAccessMode}
              onChange={(event) =>
                setForm({
                  ...form,
                  catalogAccessMode: event.target.value as ClientForm["catalogAccessMode"],
                })
              }
            >
              <option value="SELECTED">Selective catalog</option>
              <option value="ALL_APPROVED">Entire catalog</option>
            </select>
          </Field>
          <p className="text-xs text-slate-500 sm:col-span-2">
            {form.catalogAccessMode === "ALL_APPROVED"
              ? "All eligible published catalog content is included by default. Exclusions can narrow access."
              : "Only explicitly included taxonomy, companies, or products are available. Exclusions still take precedence."}
          </p>
          <label className="flex items-center gap-2 self-end rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.pricesVisible}
              onChange={(event) => setForm({ ...form, pricesVisible: event.target.checked })}
            />
            Client may see prices
          </label>
          <p className="text-xs text-slate-500 sm:col-span-2">
            New accounts default to hidden prices and disabled catalog access. Client sign-in
            credentials remain managed through the existing Client User system.
          </p>
          <div className="flex gap-2 sm:col-span-2">
            <button
              disabled={busy || !form.priceProfileId}
              className="rounded bg-[#102c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save Client"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border bg-white">
        {clients.length ? (
          clients.map((client) => (
            <article
              key={client.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b p-4 last:border-b-0"
            >
              <div className="min-w-52 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{client.name}</h2>
                  <StatusPill active={client.status === "ACTIVE"}>
                    {client.status === "ACTIVE" ? "Active" : "Inactive"}
                  </StatusPill>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Price Profile: {client.priceProfile?.name ?? "Unassigned"} · {client.userCount}{" "}
                  user(s)
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Prices {client.pricesVisible ? "visible" : "hidden"} · Catalog{" "}
                  {client.catalogAccessStatus.toLowerCase()} ·{" "}
                  {client.catalogAccessMode === "ALL_APPROVED"
                    ? "entire catalog"
                    : `${client.visibilityRuleCount} selected visibility rule(s)`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => edit(client)}
                className="inline-flex items-center gap-1 rounded border px-3 py-2 text-sm font-medium"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() =>
                  setExpandedAccessId((current) => (current === client.id ? null : client.id))
                }
                className="rounded border px-3 py-2 text-sm font-medium"
              >
                {expandedAccessId === client.id ? "Close access rules" : "Manage access rules"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setExpandedUsersId((current) => (current === client.id ? null : client.id))
                }
                className="inline-flex items-center gap-1 rounded border px-3 py-2 text-sm font-medium"
              >
                <Users className="h-4 w-4" />
                {expandedUsersId === client.id ? "Close users" : "Manage users"}
              </button>
              {expandedAccessId === client.id && (
                <ClientCatalogAccessEditor
                  clientAccountId={client.id}
                  catalogAccessMode={client.catalogAccessMode}
                />
              )}
              {expandedUsersId === client.id && (
                <ClientAccountUsersPanel
                  clientAccountId={client.id}
                  clientAccountName={client.name}
                />
              )}
            </article>
          ))
        ) : (
          <p className="p-6 text-sm text-slate-600">No Client Accounts are set up yet.</p>
        )}
      </section>

      <AlertDialog open={confirmModeChange} onOpenChange={setConfirmModeChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm catalog access change</AlertDialogTitle>
            <AlertDialogDescription>
              {form.catalogAccessMode === "ALL_APPROVED"
                ? "Entire catalog mode includes all eligible published content. Existing Include rules will be removed; exclusions remain in effect."
                : "Selective catalog mode stops default access. Only explicitly added Include rules grant access, and exclusions continue to take precedence."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void performSave()}>
              Confirm access change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function StatusPill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
    >
      {children}
    </span>
  );
}
