import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/Logo";
import { getCurrentActor, loginClient } from "@/lib/api/auth.functions";

export const Route = createFileRoute("/client/login")({
  beforeLoad: async () => {
    const result = await getCurrentActor();
    if (result.actor?.actorType === "CLIENT") throw redirect({ to: "/client" });
  },
  component: ClientLogin,
});

function ClientLogin() {
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
      const result = await loginClient({ data: { email, password } });
      if (result.actor?.actorType !== "CLIENT") {
        setError(
          "Unable to sign in. Check your email and password or contact your account administrator.",
        );
        return;
      }
      await navigate({ to: "/client" });
    } catch {
      setError(
        "Unable to sign in. Check your email and password or contact your account administrator.",
      );
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
                Client workspace
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">
                Your Wossol operations, connected.
              </h1>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Sign in with the credentials provided by your account administrator.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-amber-300" /> Secure client access
          </div>
        </div>
        <div className="p-6 sm:p-10 lg:p-14">
          <div className="sm:hidden">
            <Logo imageClassName="h-12" />
          </div>
          <div className="mt-10 sm:mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              Wossol Export Client
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Sign in to your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Use your Client User email and password to continue.
            </p>
          </div>
          <form onSubmit={submit} className="mt-8 space-y-5">
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
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
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
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#102c50] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          <p className="mt-8 text-xs leading-5 text-slate-400">
            If you cannot access your account, contact your Wossol account administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
