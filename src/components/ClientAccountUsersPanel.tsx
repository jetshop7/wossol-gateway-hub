import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Pencil, Plus, Users } from "lucide-react";

import {
  createAdminClientUserFn,
  listAdminClientUsersFn,
  updateAdminClientUserFn,
} from "@/lib/api/commercial-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

type ClientUserRow = {
  id: string;
  displayName: string;
  email: string;
  designation: "PRIMARY_ADMIN" | "CLIENT_USER";
  status: "ACTIVE" | "DISABLED";
};
type UserForm = {
  displayName: string;
  email: string;
  password: string;
  status: "ACTIVE" | "DISABLED";
};

const emptyForm = (): UserForm => ({ displayName: "", email: "", password: "", status: "ACTIVE" });

export function ClientAccountUsersPanel({
  clientAccountId,
  clientAccountName,
}: {
  clientAccountId: string;
  clientAccountName: string;
}) {
  const [users, setUsers] = useState<ClientUserRow[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const result = await listAdminClientUsersFn({ data: { clientAccountId } });
      if (result.ok) setUsers(result.users);
      else setError("Client users could not be loaded.");
    } catch {
      setError("Client users could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // Account identity is stable for the lifetime of this panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientAccountId]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };

  const startEdit = (user: ClientUserRow) => {
    setEditingId(user.id);
    setForm({
      displayName: user.displayName,
      email: user.email,
      password: "",
      status: user.status,
    });
    setError("");
    setShowForm(true);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = editingId
        ? await updateAdminClientUserFn({
            data: {
              clientAccountId,
              userId: editingId,
              data: {
                displayName: form.displayName,
                email: form.email,
                status: form.status,
                ...(form.password ? { password: form.password } : {}),
              },
            },
            headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
          })
        : await createAdminClientUserFn({
            data: {
              clientAccountId,
              data: {
                displayName: form.displayName,
                email: form.email,
                password: form.password,
                status: form.status,
              },
            },
            headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
          });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      await refresh();
    } catch {
      setError("Client User could not be saved. Check that the email is not already in use.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Users className="h-4 w-4 text-amber-600" /> Client Users
          </h3>
          <p className="mt-1 text-xs text-slate-600">{clientAccountName} sign-in accounts</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Client User
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={save}
          className="mt-4 grid gap-3 rounded-md border bg-white p-4 sm:grid-cols-2"
        >
          <h4 className="font-semibold sm:col-span-2">
            {editingId ? "Edit Client User" : "Create Client User"}
          </h4>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Display name
            <input
              required
              maxLength={120}
              value={form.displayName}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Email
            <input
              required
              type="email"
              maxLength={320}
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {editingId ? "New password (leave blank to keep current)" : "Initial password"}
            <input
              required={!editingId}
              type="password"
              minLength={12}
              maxLength={256}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as UserForm["status"] })
              }
              className="rounded border px-3 py-2"
            >
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </label>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
            Credentials are stored as a one-way password hash. No invitation email is sent; share
            initial or reset credentials with the user through your approved secure channel.
          </p>
          <div className="flex gap-2 sm:col-span-2">
            <button
              disabled={busy}
              className="rounded bg-[#102c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save Client User"}
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

      <div className="mt-3 divide-y rounded-md border bg-white">
        {loading ? (
          <p className="p-3 text-sm text-slate-500">Loading users…</p>
        ) : users.length ? (
          users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium text-slate-900">{user.displayName}</p>
                <p className="text-sm text-slate-600">{user.email}</p>
                {user.designation === "PRIMARY_ADMIN" && (
                  <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">
                    Primary Client Admin
                  </span>
                )}
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                >
                  {user.status === "ACTIVE" ? "Active" : "Disabled"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => startEdit(user)}
                className="inline-flex items-center gap-1 rounded border px-3 py-2 text-sm font-medium"
              >
                {user.status === "ACTIVE" ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {user.status === "ACTIVE" ? "Edit" : "Edit / activate"}
              </button>
            </div>
          ))
        ) : (
          <p className="p-3 text-sm text-slate-600">No Client Users yet.</p>
        )}
      </div>
    </section>
  );
}
