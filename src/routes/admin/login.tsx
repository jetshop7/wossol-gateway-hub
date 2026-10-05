import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { loginInternal } from "@/lib/api/auth.functions";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await loginInternal({ data: { email, password } });
      if (result.actor?.actorType !== "INTERNAL") {
        setError("Invalid email or password.");
        return;
      }
      await navigate({ to: "/admin/catalog/companies" });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-950 sm:grid sm:place-items-center sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-gradient-to-br from-slate-950 via-[#102c50] to-[#1b426e] p-10 text-white sm:flex sm:flex-col sm:justify-between">
          <div>
            <Logo imageClassName="h-12 brightness-0 invert md:h-14" />
            <div className="mt-16 max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
                Private workspace
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">
                Catalog operations, kept clear.
              </h1>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Manage the Wossol Export company and brand foundation from one focused internal
                workspace.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-amber-300" /> Internal access only
          </div>
        </div>
        <div className="p-6 sm:p-10 lg:p-14">
          <div className="sm:hidden">
            <Logo imageClassName="h-12" />
          </div>
          <div className="mt-10 sm:mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              Wossol Export Admin
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Sign in to continue
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Use your internal Wossol Export account to access catalog operations.
            </p>
          </div>
          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="username"
                  required
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Password</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#102c50] px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          <p className="mt-8 text-xs leading-5 text-slate-400">
            This area is restricted to authorized Wossol Export internal users.
          </p>
        </div>
      </div>
    </div>
  );
}
