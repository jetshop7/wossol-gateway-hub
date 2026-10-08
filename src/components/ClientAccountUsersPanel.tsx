import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";

import {
  getAdminPrimaryPartnerLoginFn,
  getAdminPrimaryClientLoginFn,
  saveAdminPrimaryPartnerLoginFn,
  saveAdminPrimaryClientLoginFn,
} from "@/lib/api/commercial-admin.functions";
import { readCsrfToken } from "@/lib/admin-csrf";

type PrimaryLogin = {
  id: string;
  displayName: string;
  email: string;
  status: "ACTIVE" | "DISABLED";
  designation: "PRIMARY_ADMIN" | "CLIENT_USER" | "PARTNER_ADMIN";
};

export function ClientAccountUsersPanel({
  clientAccountId,
  clientAccountName,
  accountStatus,
  accountType,
}: {
  clientAccountId: string;
  clientAccountName: string;
  accountStatus: "ACTIVE" | "INACTIVE" | "DISABLED";
  accountType: "DIRECT_CLIENT" | "PARTNER";
}) {
  const [login, setLogin] = useState<PrimaryLogin | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const response =
        accountType === "PARTNER"
          ? await getAdminPrimaryPartnerLoginFn({ data: { catalogAccountId: clientAccountId } })
          : await getAdminPrimaryClientLoginFn({ data: { clientAccountId } });
      if (response.ok && response.login) {
        setLogin(response.login);
        setDisplayName(response.login.displayName);
        setEmail(response.login.email);
      } else if (response.ok) {
        setLogin(null);
        setDisplayName("");
        setEmail("");
      } else {
        setError("Primary account access could not be loaded.");
      }
    } catch {
      setError("Primary account access could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientAccountId]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const credentials = { displayName, email, ...(password ? { password } : {}) };
      const response =
        accountType === "PARTNER"
          ? await saveAdminPrimaryPartnerLoginFn({
              data: { catalogAccountId: clientAccountId, data: credentials },
              headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
            })
          : await saveAdminPrimaryClientLoginFn({
              data: { clientAccountId, data: credentials },
              headers: { "x-wossol-csrf": readCsrfToken() ?? "" },
            });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setPassword("");
      setNotice(
        password
          ? `Login details saved. Existing ${accountType === "PARTNER" ? "Partner" : "Client"} sessions were signed out.`
          : "Login details saved.",
      );
      await refresh();
    } catch {
      setError("Account access could not be saved. Check that the email is available.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <KeyRound className="h-4 w-4 text-amber-600" /> Account access
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Manage the primary {accountType === "PARTNER" ? "Partner Admin" : "Client"} sign-in for {clientAccountName}.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${accountStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-slate-200 text-slate-700"}`}
        >
          Account {accountStatus.toLowerCase()}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading account login…</p>
      ) : (
        <form
          onSubmit={save}
          className="mt-4 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-700" /> Primary login
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Passwords are never displayed. Setting a new password invalidates current {accountType === "PARTNER" ? "Partner" : "Client"} sessions.
            </p>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Display name
            <input
              required
              maxLength={120}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Login email
            <input
              required
              type="email"
              maxLength={320}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
            {login ? "Set a new password (optional)" : "Initial password"}
            <input
              required={!login}
              type="password"
              minLength={12}
              maxLength={256}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          {login && (
            <p className="text-xs text-slate-600 sm:col-span-2">
              Login status:{" "}
              <span className="font-semibold">
                {login.status === "ACTIVE" ? "Active" : "Disabled"}
              </span>
              {login.designation === "CLIENT_USER" &&
                " · This existing account login will be designated as the primary login when saved."}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              disabled={busy}
              className="inline-flex items-center gap-2 rounded bg-[#102c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />{" "}
              {busy ? "Saving…" : login ? "Save account access" : "Create primary login"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
