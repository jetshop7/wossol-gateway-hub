import { useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Copy, Pencil, Plus } from "lucide-react";

import {
  createAdminPriceProfileFn,
  duplicateAdminPriceProfileFn,
  listAdminPriceProfilesFn,
  updateAdminPriceProfileFn,
} from "@/lib/api/commercial-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/catalog/price-profiles")({
  loader: () => listAdminPriceProfilesFn(),
  component: PriceProfilesPage,
});

type ProfileForm = {
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  defaultAdjustment: string;
};

const blankProfile = (): ProfileForm => ({
  name: "",
  description: "",
  status: "ACTIVE",
  defaultAdjustment: "0",
});

function PriceProfilesPage() {
  const result = Route.useLoaderData();
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(blankProfile);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [duplicateTarget, setDuplicateTarget] = useState<{ id: string; name: string } | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const profiles = result.ok ? result.profiles : [];

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = editingId
        ? await updateAdminPriceProfileFn({
            data: { id: editingId, data: form },
            headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
          })
        : await createAdminPriceProfileFn({
            data: form,
            headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
          });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setForm(blankProfile());
      await router.invalidate();
    } catch {
      setError("Price Profile could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const edit = (profile: (typeof profiles)[number]) => {
    setEditingId(profile.id);
    setForm({
      name: profile.name,
      description: profile.description ?? "",
      status: profile.status,
      defaultAdjustment: profile.defaultAdjustment,
    });
    setShowForm(true);
    setError("");
  };

  const duplicate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!duplicateTarget || !duplicateName.trim() || duplicating) return;
    setError("");
    setDuplicating(true);
    try {
      const response = await duplicateAdminPriceProfileFn({
        data: { id: duplicateTarget.id, newName: duplicateName.trim() },
        headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
      });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setDuplicateTarget(null);
      setDuplicateName("");
      await router.invalidate();
    } catch {
      setError("Price Profile could not be duplicated.");
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            Commercial settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Price Profiles</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Adjust each Variant’s Wossol selling price for assigned clients. Supplier cost remains
            internal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(blankProfile());
            setError("");
            setShowForm((value) => !value);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-[#102c50] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Add Price Profile
        </button>
      </header>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={save} className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
          <h2 className="text-lg font-semibold sm:col-span-2">
            {editingId ? "Edit Price Profile" : "Create Price Profile"}
          </h2>
          <Field label="Profile name *">
            <input
              required
              maxLength={120}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Default percentage adjustment *">
            <div className="flex items-center gap-2">
              <input
                required
                inputMode="decimal"
                value={form.defaultAdjustment}
                onChange={(event) => setForm({ ...form, defaultAdjustment: event.target.value })}
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </Field>
          <Field label="Internal description">
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as ProfileForm["status"] })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <button
              disabled={busy}
              className="rounded bg-[#102c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save Profile"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-500 sm:col-span-2">
            The percentage applies to the Variant’s base selling price; positive values increase it
            and negative values reduce it.
          </p>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Profile</span>
          <span>Default adjustment</span>
          <span>Clients</span>
          <span>Overrides</span>
        </div>
        {profiles.length ? (
          profiles.map((profile) => (
            <article
              key={profile.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 border-b px-4 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-semibold">{profile.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {profile.description || "No internal description"}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${profile.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                >
                  {profile.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </div>
              <span className="text-sm tabular-nums">{profile.defaultAdjustment}%</span>
              <span className="text-sm tabular-nums">{profile.assignedClientCount}</span>
              <span className="text-sm tabular-nums">{profile.overrideCount}</span>
              <div className="col-span-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => edit(profile)}
                  className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateTarget({ id: profile.id, name: profile.name });
                    setDuplicateName(`${profile.name} copy`);
                  }}
                  className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="p-6 text-sm text-slate-600">
            No Price Profiles yet. Create one before assigning client accounts.
          </p>
        )}
      </section>
      <Dialog
        open={duplicateTarget !== null}
        onOpenChange={(open) => !open && setDuplicateTarget(null)}
      >
        <DialogContent>
          <form onSubmit={duplicate} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Duplicate Price Profile</DialogTitle>
              <DialogDescription>
                Create an independent copy of {duplicateTarget?.name ?? "this profile"} and its
                variant overrides.
              </DialogDescription>
            </DialogHeader>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              New profile name
              <input
                autoFocus
                required
                maxLength={120}
                value={duplicateName}
                onChange={(event) => setDuplicateName(event.target.value)}
                className="rounded-md border px-3 py-2"
              />
            </label>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDuplicateTarget(null)}
                className="rounded-md border px-4 py-2 text-sm"
                disabled={duplicating}
              >
                Cancel
              </button>
              <button
                disabled={duplicating || !duplicateName.trim()}
                className="rounded-md bg-[#102c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {duplicating ? "Duplicating…" : "Create duplicate"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
